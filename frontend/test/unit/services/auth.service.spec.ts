import { FirebaseError } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User,
    type UserCredential
} from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../../../src/services/api.client';
import {
    createProfile,
    discardIncompleteAccount,
    EmailNotVerifiedError,
    getAuthErrorMessage,
    getProfile,
    hasProfile,
    isProfileMissingError,
    login,
    logout,
    register,
    resendVerificationEmail,
    signInWithGoogle,
    type UserProfile
} from '../../../src/services/auth.service';

// Firebase Authentication is replaced by test doubles: no real accounts are created.
vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    deleteUser: vi.fn(),
    sendEmailVerification: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: class {
        setCustomParameters() {}
    }
}));

// The real Firebase app is never initialised in tests. currentUser is changed by some tests.
const mockAuth = vi.hoisted(() => ({name: 'test-auth', currentUser: null as unknown}));
vi.mock('../../../src/config/firebase', () => ({auth: mockAuth}));

// Keeps the real ApiError class but replaces the HTTP call to the backend.
vi.mock('../../../src/services/api.client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/api.client')>()),
    apiRequest: vi.fn()
}));

const FIREBASE_USER = {uid: 'firebase-uid-1', emailVerified: true} as User;
const UNVERIFIED_USER = {uid: 'firebase-uid-2', emailVerified: false} as User;
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
        vi.mocked(sendEmailVerification).mockResolvedValue(undefined);
        mockAuth.currentUser = null;
    });

    describe('register', () => {
        it('creates the Firebase account, then the API profile, sends the verification email and signs out', async () => {
            // Expected: Firebase account created with the email/password, POST /users called with the
            // manager name, the verification email sent and the session closed so the user has to verify and log in.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            await register('ApexManager', 'apex@example.com', 'secret123');

            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'apex@example.com', 'secret123');
            expect(apiRequest).toHaveBeenCalledWith('/users', {
                method: 'POST',
                body: JSON.stringify({name: 'ApexManager'})
            });
            expect(sendEmailVerification).toHaveBeenCalledWith(FIREBASE_USER);
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
                .rejects.toThrow('Este usuario ya tiene un perfil creado en la aplicación.');
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

        it('translates a disabled sign-in provider', async () => {
            // Expected: "Este método de acceso no está disponible en este momento."
            vi.mocked(createUserWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/operation-not-allowed', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Este método de acceso no está disponible en este momento.');
        });

        it('uses a generic message for unknown Firebase errors', async () => {
            // Expected: the generic message "Ha ocurrido un error inesperado."
            vi.mocked(createUserWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/some-new-error', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123'))
                .rejects.toThrow('Ha ocurrido un error inesperado.');
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

            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'apex@example.com', 'secret123');
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

    describe('register (verification email)', () => {
        it('still finishes the registration when the verification email cannot be sent', async () => {
            // Expected: no error (the account exists and the email can be resent from login), the
            // failure logged and the session closed.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);
            vi.mocked(sendEmailVerification).mockRejectedValue(new FirebaseError('auth/too-many-requests', 'Firebase error'));

            await expect(register('ApexManager', 'apex@example.com', 'secret123')).resolves.toBeUndefined();
            expect(console.error).toHaveBeenCalledWith('Failed to send the verification email', expect.any(FirebaseError));
            expect(signOut).toHaveBeenCalledTimes(1);
        });
    });

    describe('login (email verification)', () => {
        it('signs out and throws EmailNotVerifiedError when the email is not verified', async () => {
            // Expected: EmailNotVerifiedError, the session closed and the profile never requested.
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue({user: UNVERIFIED_USER} as UserCredential);

            await expect(login('apex@example.com', 'secret123')).rejects.toBeInstanceOf(EmailNotVerifiedError);
            expect(signOut).toHaveBeenCalledTimes(1);
            expect(apiRequest).not.toHaveBeenCalled();
        });
    });

    describe('resendVerificationEmail', () => {
        it('signs in, sends the email and signs out', async () => {
            // Expected: 'sent', the email sent to the user and the session closed afterwards.
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue({user: UNVERIFIED_USER} as UserCredential);

            await expect(resendVerificationEmail('apex@example.com', 'secret123')).resolves.toBe('sent');
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'apex@example.com', 'secret123');
            expect(sendEmailVerification).toHaveBeenCalledWith(UNVERIFIED_USER);
            expect(signOut).toHaveBeenCalledTimes(1);
        });

        it('does not send anything when the email is already verified', async () => {
            // Expected: 'alreadyVerified', no email and the session closed.
            await expect(resendVerificationEmail('apex@example.com', 'secret123')).resolves.toBe('alreadyVerified');
            expect(sendEmailVerification).not.toHaveBeenCalled();
            expect(signOut).toHaveBeenCalledTimes(1);
        });

        it('signs out and translates the error when Firebase refuses to send it', async () => {
            // Expected: "Demasiados intentos. Inténtalo más tarde." and the session closed anyway.
            vi.mocked(signInWithEmailAndPassword).mockResolvedValue({user: UNVERIFIED_USER} as UserCredential);
            vi.mocked(sendEmailVerification).mockRejectedValue(new FirebaseError('auth/too-many-requests', 'Firebase error'));

            await expect(resendVerificationEmail('apex@example.com', 'secret123'))
                .rejects.toThrow('Demasiados intentos. Inténtalo más tarde.');
            expect(signOut).toHaveBeenCalledTimes(1);
        });

        it('translates wrong credentials', async () => {
            // Expected: "Correo o contraseña incorrectos." and no email sent.
            vi.mocked(signInWithEmailAndPassword)
                .mockRejectedValue(new FirebaseError('auth/invalid-credential', 'Firebase error'));

            await expect(resendVerificationEmail('apex@example.com', 'wrong-pass1'))
                .rejects.toThrow('Correo o contraseña incorrectos.');
            expect(sendEmailVerification).not.toHaveBeenCalled();
        });
    });

    describe('signInWithGoogle', () => {
        it('opens the Google window and returns true when the user signs in', async () => {
            // Expected: signInWithPopup called with the app's auth instance and true.
            vi.mocked(signInWithPopup).mockResolvedValue({user: FIREBASE_USER} as UserCredential);

            await expect(signInWithGoogle()).resolves.toBe(true);
            expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.anything());
        });

        it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])(
            'returns false when the user closes the window (%s)',
            async (code) => {
                // Expected: false, no error and nothing logged.
                vi.mocked(signInWithPopup).mockRejectedValue(new FirebaseError(code, 'Firebase error'));

                await expect(signInWithGoogle()).resolves.toBe(false);
                expect(console.error).not.toHaveBeenCalled();
            }
        );

        it('throws the original Firebase error for other failures', async () => {
            // Expected: the same FirebaseError (its code is translated later by the action).
            const error = new FirebaseError('auth/popup-blocked', 'Firebase error');
            vi.mocked(signInWithPopup).mockRejectedValue(error);

            await expect(signInWithGoogle()).rejects.toBe(error);
        });
    });

    describe('hasProfile', () => {
        it('returns true when the API returns the profile', async () => {
            // Expected: true.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            await expect(hasProfile()).resolves.toBe(true);
        });

        it('returns false when the API answers 404', async () => {
            // Expected: false (first Google sign-in, no FootFusion profile yet).
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(404, 'User not found'));

            await expect(hasProfile()).resolves.toBe(false);
        });

        it('throws the generic message for other API failures', async () => {
            // Expected: "Ha ocurrido un error inesperado."
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(500, 'Internal error'));

            await expect(hasProfile()).rejects.toThrow('Ha ocurrido un error inesperado.');
        });
    });

    describe('createProfile', () => {
        it('creates the profile with the manager name', async () => {
            // Expected: POST /users with the name and the created profile returned.
            vi.mocked(apiRequest).mockResolvedValue(PROFILE);

            await expect(createProfile('ApexManager')).resolves.toEqual(PROFILE);
            expect(apiRequest).toHaveBeenCalledWith('/users', {
                method: 'POST',
                body: JSON.stringify({name: 'ApexManager'})
            });
        });

        it('reports a duplicated profile when the API answers 409', async () => {
            // Expected: "Este usuario ya tiene un perfil creado en la aplicación."
            vi.mocked(apiRequest).mockRejectedValue(new ApiError(409, 'Conflict'));

            await expect(createProfile('ApexManager')).rejects.toThrow('Este usuario ya tiene un perfil creado en la aplicación.');
        });
    });

    describe('discardIncompleteAccount', () => {
        it('deletes the logged-in Firebase account', async () => {
            // Expected: deleteUser called with the current user and no sign out needed.
            mockAuth.currentUser = FIREBASE_USER;

            await discardIncompleteAccount();

            expect(deleteUser).toHaveBeenCalledWith(FIREBASE_USER);
            expect(signOut).not.toHaveBeenCalled();
        });

        it('only signs out when Firebase refuses to delete it', async () => {
            // Expected: signOut called (the backend cleanup job deletes the account later).
            mockAuth.currentUser = FIREBASE_USER;
            vi.mocked(deleteUser).mockRejectedValue(new FirebaseError('auth/requires-recent-login', 'Firebase error'));

            await discardIncompleteAccount();

            expect(signOut).toHaveBeenCalledWith(mockAuth);
        });

        it('does nothing when there is no session', async () => {
            // Expected: neither deleteUser nor signOut called.
            await discardIncompleteAccount();

            expect(deleteUser).not.toHaveBeenCalled();
            expect(signOut).not.toHaveBeenCalled();
        });
    });

    describe('getAuthErrorMessage', () => {
        it('translates known Firebase codes', () => {
            // Expected: the Spanish message of the code.
            expect(getAuthErrorMessage('auth/popup-blocked'))
                .toBe('El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.');
        });

        it('uses the generic message for unknown codes', () => {
            // Expected: "Ha ocurrido un error inesperado."
            expect(getAuthErrorMessage('auth/some-new-error')).toBe('Ha ocurrido un error inesperado.');
        });
    });

    describe('isProfileMissingError', () => {
        it('is true only for a 404 from the API', () => {
            // Expected: true for ApiError 404, false for other statuses and other errors.
            expect(isProfileMissingError(new ApiError(404, 'User not found'))).toBe(true);
            expect(isProfileMissingError(new ApiError(500, 'Internal error'))).toBe(false);
            expect(isProfileMissingError(new Error('User not found'))).toBe(false);
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

            expect(signOut).toHaveBeenCalledWith(mockAuth);
        });
    });
});
