import { redirect } from "react-router-dom";
import { auth } from "../config/firebase";
import { getProfile, logout } from "../services/auth.service";
import { getDashboardData, getManagerSummary } from "../services/dashboard.service";
import { consumeRegisteredFlash } from "./flash-messages";

/**
 * Loader of the protected layout (AppLayout). Runs before any protected page renders.
 * Waits for Firebase to restore the session, loads the user profile from the API and
 * redirects to /login when there is no valid session.
 */
export async function protectedLoader() {
    // On a page reload auth.currentUser is null until Firebase restores the persisted session.
    await auth.authStateReady();

    if (!auth.currentUser) {
        throw redirect('/login');
    }

    try {
        const profile = await getProfile();
        const summary = await getManagerSummary();
        return {profile, summary};
    } catch (error) {
        // A Firebase user without a profile in our API (or an API failure) is not a usable session.
        // Signing out also prevents a redirect loop with redirectIfAuthenticatedLoader.
        console.error('Failed to load the authenticated user profile', error);
        await logout();
        throw redirect('/login');
    }
}

/** Loader of the auth layout (AuthLayout): users with a session are sent straight to /home. */
export async function redirectIfAuthenticatedLoader() {
    await auth.authStateReady();

    if (auth.currentUser) {
        throw redirect('/home');
    }
    return null;
}

/** Loader of LoginPage: tells the page whether to show the "account created" message (only once). */
export function loginLoader() {
    return {justRegistered: consumeRegisteredFlash()};
}

/** Loader of HomePage: initial data for the dashboard cards. */
export function homeLoader() {
    return getDashboardData();
}
