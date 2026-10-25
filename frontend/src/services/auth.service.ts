import {
    createUserWithEmailAndPassword,
    deleteUser,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "firebase/auth";
import { auth } from "../config/firebase";
import { ApiError, apiRequest } from "./api.client";
import { FirebaseError } from "firebase/app";

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    profilePhoto?: string;
    role: 'ADMIN' | 'USER';
    registerDate: string;
}

/** Thrown by login() when the credentials are right but the email has not been verified yet. */
export class EmailNotVerifiedError extends Error {
    constructor() {
        super('The email address has not been verified');
    }
}

const UNEXPECTED_ERROR_MESSAGE = 'Ha ocurrido un error inesperado.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña no cumple los requisitos mínimos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
    'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
    'auth/operation-not-allowed': 'Este método de acceso no está disponible en este momento.',
    'auth/configuration-not-found': 'Este método de acceso no está disponible en este momento.',
    'auth/unauthorized-domain': 'Este método de acceso no está disponible en este momento.',
    'auth/user-disabled': 'Esta cuenta está desactivada.',
    'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo. Inicia sesión con tu correo y contraseña.'
}

/** Codes Firebase returns when the user closes the Google window: not an error to show. */
const DISMISSED_POPUP_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

// Always lets the user pick the Google account, so "Usar otra cuenta" can choose a different one.
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: 'select_account'});

/** Spanish message for a Firebase Auth error code. */
export function getAuthErrorMessage(code: string): string {
    return AUTH_ERROR_MESSAGES[code] ?? UNEXPECTED_ERROR_MESSAGE;
}

function matchError(error: unknown): Error {
    if (error instanceof EmailNotVerifiedError) {
        return error;
    }

    // Show the error at console to developers
    console.error('Authentication request failed', error);

    if (error instanceof FirebaseError) {
        return new Error(getAuthErrorMessage(error.code));
    }
    if (error instanceof ApiError && error.status === 409) {
        return new Error("Este usuario ya tiene un perfil creado en la aplicación.");
    }
    return new Error(UNEXPECTED_ERROR_MESSAGE);
}

/** True when the API answered that the logged-in Firebase user has no FootFusion profile. */
export function isProfileMissingError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}

export async function register(name: string, email: string, password: string): Promise<void> {
    try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        try {
            await apiRequest<UserProfile>("/users", {
                method: 'POST',
                body: JSON.stringify({name})
            })
        } catch (error) {
            await deleteUser(credential.user);
            throw error;
        }

        try {
            await sendEmailVerification(credential.user);
        } catch (error) {
            // The account is already created: the user can ask for the email again from the login page.
            console.error('Failed to send the verification email', error);
        }

        await signOut(auth);
    } catch (error) {
        throw matchError(error);
    }
}

/**
 * Signs in with email and password. Users whose email is not verified are signed out again and
 * EmailNotVerifiedError is thrown, so they cannot use the application until they verify it.
 */
export async function login(email: string, password: string): Promise<UserProfile> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);

        if (!credential.user.emailVerified) {
            await signOut(auth);
            throw new EmailNotVerifiedError();
        }
        return await getProfile();
    } catch (error) {
        throw matchError(error);
    }
}

/**
 * Sends the verification email again. Firebase only allows it for a signed-in user, so it signs in
 * with the credentials, sends the email and signs out. Returns 'alreadyVerified' when there is nothing to send.
 */
export async function resendVerificationEmail(email: string, password: string): Promise<'sent' | 'alreadyVerified'> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);

        try {
            if (credential.user.emailVerified) {
                return 'alreadyVerified';
            }
            await sendEmailVerification(credential.user);
            return 'sent';
        } finally {
            await signOut(auth);
        }
    } catch (error) {
        throw matchError(error);
    }
}

/**
 * Opens the Google account window. It must be called directly from a click handler: browsers block
 * windows that are not opened as a response to a user action. Returns false when the user closes the
 * window; other failures are thrown as the original FirebaseError (see getAuthErrorMessage).
 */
export async function signInWithGoogle(): Promise<boolean> {
    try {
        await signInWithPopup(auth, googleProvider);
        return true;
    } catch (error) {
        if (error instanceof FirebaseError && DISMISSED_POPUP_CODES.includes(error.code)) {
            return false;
        }
        console.error('Google sign-in failed', error);
        throw error;
    }
}

/** Whether the logged-in user already has a FootFusion profile (false means a first Google sign-in). */
export async function hasProfile(): Promise<boolean> {
    try {
        await getProfile();
        return true;
    } catch (error) {
        if (isProfileMissingError(error)) {
            return false;
        }
        throw matchError(error);
    }
}

/** Creates the FootFusion profile of the logged-in user (used to finish a Google sign-up). */
export async function createProfile(name: string): Promise<UserProfile> {
    try {
        return await apiRequest<UserProfile>("/users", {
            method: 'POST',
            body: JSON.stringify({name})
        });
    } catch (error) {
        throw matchError(error);
    }
}

/**
 * Deletes the logged-in Firebase account that never got a FootFusion profile (a Google sign-up left
 * unfinished), so nothing is kept from an incomplete sign-up. If Firebase refuses to delete it
 * (e.g. the session is too old) it only signs out; the backend cleanup job removes it later.
 */
export async function discardIncompleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        return;
    }

    try {
        await deleteUser(user);
    } catch (error) {
        console.error('Failed to delete the incomplete account', error);
        await signOut(auth);
    }
}

export function getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/me')
}

export function logout(): Promise<void> {
    return signOut(auth);
}
