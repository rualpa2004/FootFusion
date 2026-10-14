import { FirebaseError } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    signOut,
    type User,
    type UserCredential
} from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../../../src/services/api.client';
import { getProfile, login, logout, register, type UserProfile } from '../../../src/services/auth.service';

// Firebase Authentication is replaced by test doubles: no real accounts are created.
vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    deleteUser: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn()
}));

// The real Firebase app is never initialised in tests.
vi.mock('../../../src/config/firebase', () => ({auth: {name: 'test-auth'}}));

// Keeps the real ApiError class but replaces the HTTP call to the backend.
vi.mock('../../../src/services/api.client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/api.client')>()),
    apiRequest: vi.fn()
}));

const FIREBASE_USER = {uid: 'firebase-uid-1'} as User;
const PROFILE: UserProfile = {
    id: 1,
    name: 'ApexManager',
    email: 'apex@example.com',
    role: 'USER',
    registerDate: '2026-10-09T10:00:00.000Z'
};

describe('auth.service', () => {
    beforeEach(() => {
        // matchError logs every failure on purpose; silence it to keep the test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({user: FIREBASE_USER} as UserCredential);
        vi.mocked(signInWithEmailAndPassword).mockResolvedValue({user: FIREBASE_USER} as UserCredential);
        vi.mocked(signOut).mockResolvedValue(undefined);
        vi.mocked(deleteUser).mockResolvedValue(undefined);
    });

    describe('register', () => {
        it('creates the Firebase account, then the API profile, and finally signs out', async () => {
            // Expected: Firebase account created with the email/password, POST /users called with the
            // manager name, and the session closed afterwards so the user has to log in.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            await register('ApexManager', 'apex@example.com', 'secret123');

            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({name: 'test-auth'}, 'apex@example.com', 'secret123');
            expect(apiRequest).toHaveBeenCalledWith('/users', {
                method: 'POST',
                body: JSON.stringify({name: 'ApexManager'})
            });
            expect(signOut).toHaveBeenCalledTimes(1);
            expect(deleteUser).not.toHaveBeenCalled();
        });

        it('deletes the Firebase account when the API profile cannot be created', async () => {
            // Expected: the Firebase account is deleted (no half-created users), no sign out,
            // and the error is reported with the generic message.
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(500, 'Internal error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Ha ocurrido un error inesperado.');
            expect(deleteUser).toHaveBeenCalledWith(FIREBASE_USER);
            expect(signOut).not.toHaveBeenCalled();
        });

        it('reports a duplicated profile when the API answers 409', async () => {
            // Expected: the Firebase account is deleted and the message explains the profile already exists.
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(409, 'Conflict'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Este usuario ya tiene un perfil creado en la aplicación');
            expect(deleteUser).toHaveBeenCalledWith(FIREBASE_USER);
        });

        it('translates a Firebase "email already in use" error', async () => {
            // Expected: the Spanish message "Este correo ya está registrado." and the API is never called.
            vi.mocked(createUserWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/email-already-in-use', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Este correo ya está registrado.');
            expect(apiRequest).not.toHaveBeenCalled();
        });

        it('translates a disabled email/password provider', async () => {
            // Expected: "El acceso con correo no está disponible en este momento."
            vi.mocked(createUserWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/operation-not-allowed', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('El acceso con correo no está disponible en este momento.');
        });

        it('uses a generic message for unknown Firebase errors', async () => {
            // Expected: the generic message "Ha ocurrido un error inesperado".
            vi.mocked(createUserWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/some-new-error', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Ha ocurrido un error inesperado');
        });

        it('logs the original error for debugging', async () => {
            // Expected: console.error called with the original Firebase error.
            const firebaseError = new FirebaseError('auth/email-already-in-use', 'Firebase error');
            vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(firebaseError);

            await expect(register('ApexManager', 'apex@example.com', 'secret123')).rejects.toThrow();
            expect(console.error).toHaveBeenCalledWith('Authentication request failed', firebaseError);
        });
    });

    describe('login', () => {
        it('signs in with Firebase and returns the API profile', async () => {
            // Expected: Firebase sign-in with the credentials, GET /users/me and the profile returned.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            const profile = await login('apex@example.com', 'secret123');

            expect(signInWithEmailAndPassword).toHaveBeenCalledWith({name: 'test-auth'}, 'apex@example.com', 'secret123');
            expect(apiRequest).toHaveBeenCalledWith('/users/me');
            expect(profile).toEqual(PROFILE);
        });

        it('translates wrong credentials', async () => {
            // Expected: "Correo o contraseña incorrectos." and the profile is never requested.
            vi.mocked(signInWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/invalid-credential', 'Firebase error'));

            await expect(login('apex@example.com', 'wrong-pass1')).rejects.toThrow('Correo o contraseña incorrectos.');
            expect(apiRequest).not.toHaveBeenCalled();
        });

        it('translates too many attempts', async () => {
            // Expected: "Demasiados intentos. Inténtalo más tarde."
            vi.mocked(signInWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/too-many-requests', 'Firebase error'));

            await expect(login('apex@example.com', 'secret123')).rejects.toThrow('Demasiados intentos. Inténtalo más tarde.');
        });

        it('fails with the generic message when the user has no profile in the API', async () => {
            // Expected: the generic message "Ha ocurrido un error inesperado."
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(404, 'User not found'));

            await expect(login('apex@example.com', 'secret123')).rejects.toThrow('Ha ocurrido un error inesperado.');
        });
    });

    describe('getProfile', () => {
        it('requests the authenticated user profile', async () => {
            // Expected: GET /users/me and its response returned as is.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            await expect(getProfile()).resolves.toEqual(PROFILE);
            expect(apiRequest).toHaveBeenCalledWith('/users/me');
        });
    });

    describe('logout', () => {
        it('signs out from Firebase', async () => {
            // Expected: Firebase signOut called with the app's auth instance.
            await logout();

            expect(signOut).toHaveBeenCalledWith({name: 'test-auth'});
        });
    });
});
