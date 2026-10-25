import { redirect } from "react-router-dom";
import { auth } from "../config/firebase";
import { discardIncompleteAccount, getProfile, hasProfile, isProfileMissingError, logout } from "../services/auth.service";
import { getDashboardData, getManagerSummary } from "../services/dashboard.service";
import { consumeRegisteredFlash } from "./flash-messages";
import { clearGoogleSignUpPending, isGoogleSignUpPending } from "./google-sign-up";

async function discardAbandonedSignUp(): Promise<void> {
    clearGoogleSignUpPending();
    await discardIncompleteAccount();
}


export async function protectedLoader() {
    await auth.authStateReady();
    const user = auth.currentUser;

    if (!user) {
        throw redirect('/login');
    }
    
    if (!user.emailVerified) {
        await logout();
        throw redirect('/login');
    }

    try {
        const profile = await getProfile();
        const summary = await getManagerSummary();
        return {profile, summary};
    } catch (error) {
        console.error('Failed to load the authenticated user profile', error);
        if (isProfileMissingError(error)) {
            await discardAbandonedSignUp();
        } else {
            await logout();
        }
        throw redirect('/login');
    }
}

export async function redirectIfAuthenticatedLoader() {
    await auth.authStateReady();
    const user = auth.currentUser;

    if (!user) {
        return null;
    }
    if (!user.emailVerified) {
        await logout();
        return null;
    }

    let profileExists: boolean;
    try {
        profileExists = await hasProfile();
    } catch {
        await logout();
        return null;
    }

    if (!profileExists) {
        // The user left /completar-perfil without choosing a name.
        await discardAbandonedSignUp();
        return null;
    }
    throw redirect('/home');
}

export async function completeProfileLoader() {
    await auth.authStateReady();
    const user = auth.currentUser;

    if (!user) {
        clearGoogleSignUpPending();
        throw redirect('/login');
    }

    if (!isGoogleSignUpPending()) {
        let profileExists: boolean;
        try {
            profileExists = await hasProfile();
        } catch {
            await logout();
            throw redirect('/login');
        }

        if (profileExists) {
            throw redirect('/home');
        }
        await discardAbandonedSignUp();
        throw redirect('/login');
    }

    // The Google photo is only displayed here, it is never saved in FootFusion.
    return {email: user.email ?? '', photoUrl: user.photoURL ?? undefined};
}

export function loginLoader() {
    return {registeredEmail: consumeRegisteredFlash()};
}

/** Loader of HomePage: initial data for the dashboard cards. */
export function homeLoader() {
    return getDashboardData();
}
