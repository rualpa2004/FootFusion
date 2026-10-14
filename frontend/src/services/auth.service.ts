import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signOut } from "firebase/auth";
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

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña no cumple los requisitos mínimos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
    'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
    'auth/operation-not-allowed': 'El acceso con correo no está disponible en este momento.',
    'auth/configuration-not-found': 'El acceso con correo no está disponible en este momento.'
}

function matchError(error: unknown): Error {
    // Show the error at console to developers
    console.error('Authentication request failed', error);

    if (error instanceof FirebaseError) {
        return new Error(AUTH_ERROR_MESSAGES[error.code] ?? "Ha ocurrido un error inesperado");
    }
    if (error instanceof ApiError && error.status === 409) {
        return new Error("Este usuario ya tiene un perfil creado en la aplicación");
    }
    return new Error("Ha ocurrido un error inesperado.");
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

        await signOut(auth);
    } catch (error) {
        throw matchError(error);
    }
}

export async function login(email: string, password: string): Promise<UserProfile> {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return await getProfile();
    } catch (error) {
        throw matchError(error);
    }
}

export function getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/me')
}

export function logout(): Promise<void> {
    return signOut(auth);
}