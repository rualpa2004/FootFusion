import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRegisteredFlash } from '../../../src/router/flash-messages';
import {
    clearGoogleSignUpPending,
    isGoogleSignUpPending,
    markGoogleSignUpPending
} from '../../../src/router/google-sign-up';
import {
    completeProfileLoader,
    homeLoader,
    loginLoader,
    protectedLoader,
    redirectIfAuthenticatedLoader
} from '../../../src/router/loaders';
import { ApiError } from '../../../src/services/api.client';
import {
    discardIncompleteAccount,
    getProfile,
    hasProfile,
    logout,
    type UserProfile
} from '../../../src/services/auth.service';
import {
    getDashboardData,
    getManagerSummary,
    type DashboardData,
    type ManagerSummary
} from '../../../src/services/dashboard.service';

const mockAuth = vi.hoisted(() => ({
    currentUser: null as User | null,
    authStateReady: vi.fn()
}));

vi.mock('../../../src/config/firebase', () => ({auth: mockAuth}));
vi.mock('../../../src/services/auth.service', () => ({
    getProfile: vi.fn(),
    hasProfile: vi.fn(),
    logout: vi.fn(),
    discardIncompleteAccount: vi.fn(),
    // Same rule as the real function: a 404 from the API means "no FootFusion profile".
    isProfileMissingError: (error: unknown) => error instanceof ApiError && error.status === 404
}));
vi.mock('../../../src/services/dashboard.service', () => ({
    getDashboardData: vi.fn(),
    getManagerSummary: vi.fn()
}));
vi.mock('../../../src/router/flash-messages', () => ({
    consumeRegisteredFlash: vi.fn()
}));

const VERIFIED_USER = {uid: 'firebase-uid-1', emailVerified: true} as User;
const UNVERIFIED_USER = {uid: 'firebase-uid-2', emailVerified: false} as User;
const GOOGLE_USER = {
    uid: 'firebase-uid-3',
    emailVerified: true,
    email: 'apex@gmail.com',
    photoURL: 'https://photos.example.com/apex.png'
} as User;
const PROFILE: UserProfile = {
    id: 1, name: 'ApexManager', email: 'apex@example.com', role: 'USER', registerDate: '2026-10-09'
};
const SUMMARY: ManagerSummary = {globalRank: 2421, currentGameweek: 24};

/** Runs a loader that is expected to throw a redirect and returns the thrown Response. */
async function getThrownRedirect(loader: () => Promise<unknown>): Promise<Response> {
    try {
        await loader();
    } catch (thrown) {
        expect(thrown).toBeInstanceOf(Response);
        return thrown as Response;
    }
    throw new Error('The loader did not throw a redirect');
}

describe('loaders', () => {
    beforeEach(() => {
        mockAuth.currentUser = null;
        mockAuth.authStateReady.mockResolvedValue(undefined);
        clearGoogleSignUpPending();
        vi.mocked(getProfile).mockResolvedValue(PROFILE);
        vi.mocked(hasProfile).mockResolvedValue(true);
        vi.mocked(getManagerSummary).mockResolvedValue(SUMMARY);
        vi.mocked(logout).mockResolvedValue(undefined);
        vi.mocked(discardIncompleteAccount).mockResolvedValue(undefined);
        // The profile failure is logged on purpose; silence it to keep the test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('protectedLoader', () => {
        it('redirects to /login when there is no session', async () => {
            // Expected: a 302 redirect to /login and the profile is never requested.
            const response = await getThrownRedirect(protectedLoader);

            expect(response.status).toBe(302);
            expect(response.headers.get('Location')).toBe('/login');
            expect(getProfile).not.toHaveBeenCalled();
        });

        it('returns the profile and the manager summary when there is a session', async () => {
            // Expected: { profile, summary } with the data from the services.
            mockAuth.currentUser = VERIFIED_USER;

            await expect(protectedLoader()).resolves.toEqual({profile: PROFILE, summary: SUMMARY});
        });

        it('waits for Firebase to restore the session before checking the user', async () => {
            // Expected: the loader sees the restored user and returns the data instead of redirecting.
            mockAuth.authStateReady.mockImplementation(async () => {
                mockAuth.currentUser = VERIFIED_USER;
            });

            await expect(protectedLoader()).resolves.toEqual({profile: PROFILE, summary: SUMMARY});
            expect(mockAuth.authStateReady).toHaveBeenCalledTimes(1);
        });

        it('signs out and redirects to /login when the email is not verified', async () => {
            // Expected: logout() called, a redirect to /login and the profile never requested.
            mockAuth.currentUser = UNVERIFIED_USER;

            const response = await getThrownRedirect(protectedLoader);

            expect(logout).toHaveBeenCalledTimes(1);
            expect(response.headers.get('Location')).toBe('/login');
            expect(getProfile).not.toHaveBeenCalled();
        });

        it('deletes the account when it has no profile (Google sign-up left unfinished)', async () => {
            // Expected: the incomplete account discarded, the pending mark cleared and a redirect to /login.
            mockAuth.currentUser = GOOGLE_USER;
            markGoogleSignUpPending();
            vi.mocked(getProfile).mockRejectedValue(new ApiError(404, 'User not found'));

            const response = await getThrownRedirect(protectedLoader);

            expect(discardIncompleteAccount).toHaveBeenCalledTimes(1);
            expect(logout).not.toHaveBeenCalled();
            expect(isGoogleSignUpPending()).toBe(false);
            expect(response.headers.get('Location')).toBe('/login');
        });

        it('signs out and redirects to /login when the API fails', async () => {
            // Expected: logout() called (avoids a redirect loop with the auth pages), the account is
            // not deleted, and a redirect to /login.
            mockAuth.currentUser = VERIFIED_USER;
            vi.mocked(getProfile).mockRejectedValue(new ApiError(500, 'Internal error'));

            const response = await getThrownRedirect(protectedLoader);

            expect(logout).toHaveBeenCalledTimes(1);
            expect(discardIncompleteAccount).not.toHaveBeenCalled();
            expect(response.headers.get('Location')).toBe('/login');
        });
    });

    describe('redirectIfAuthenticatedLoader', () => {
        it('redirects to /home when there is a complete session', async () => {
            // Expected: a 302 redirect to /home.
            mockAuth.currentUser = VERIFIED_USER;

            const response = await getThrownRedirect(redirectIfAuthenticatedLoader);

            expect(response.status).toBe(302);
            expect(response.headers.get('Location')).toBe('/home');
        });

        it('lets the page render when there is no session', async () => {
            // Expected: null (no redirect, the auth page is shown).
            await expect(redirectIfAuthenticatedLoader()).resolves.toBeNull();
            expect(mockAuth.authStateReady).toHaveBeenCalledTimes(1);
        });

        it('signs out an unverified user and shows the page', async () => {
            // Expected: logout() called and null.
            mockAuth.currentUser = UNVERIFIED_USER;

            await expect(redirectIfAuthenticatedLoader()).resolves.toBeNull();
            expect(logout).toHaveBeenCalledTimes(1);
        });

        it('deletes an account without profile and shows the page', async () => {
            // Expected: the incomplete account discarded and null (the user left /completar-perfil).
            mockAuth.currentUser = GOOGLE_USER;
            vi.mocked(hasProfile).mockResolvedValue(false);

            await expect(redirectIfAuthenticatedLoader()).resolves.toBeNull();
            expect(discardIncompleteAccount).toHaveBeenCalledTimes(1);
        });

        it('signs out and shows the page when the API fails', async () => {
            // Expected: logout() called, the account not deleted, and null.
            mockAuth.currentUser = VERIFIED_USER;
            vi.mocked(hasProfile).mockRejectedValue(new Error('Ha ocurrido un error inesperado.'));

            await expect(redirectIfAuthenticatedLoader()).resolves.toBeNull();
            expect(logout).toHaveBeenCalledTimes(1);
            expect(discardIncompleteAccount).not.toHaveBeenCalled();
        });
    });

    describe('completeProfileLoader', () => {
        it('returns the Google email and photo right after a first Google sign-in', async () => {
            // Expected: { email, photoUrl } from the Firebase user, without calling the API.
            mockAuth.currentUser = GOOGLE_USER;
            markGoogleSignUpPending();

            await expect(completeProfileLoader()).resolves.toEqual({
                email: 'apex@gmail.com',
                photoUrl: 'https://photos.example.com/apex.png'
            });
            expect(hasProfile).not.toHaveBeenCalled();
        });

        it('returns no photo when the Google account has none', async () => {
            // Expected: photoUrl undefined (the generic icon is shown).
            mockAuth.currentUser = {...GOOGLE_USER, photoURL: null} as User;
            markGoogleSignUpPending();

            await expect(completeProfileLoader()).resolves.toEqual({email: 'apex@gmail.com', photoUrl: undefined});
        });

        it('redirects to /login when there is no session', async () => {
            // Expected: a redirect to /login.
            const response = await getThrownRedirect(completeProfileLoader);

            expect(response.headers.get('Location')).toBe('/login');
        });

        it('deletes the account when the page is reloaded before finishing', async () => {
            // Expected: without the pending mark (lost on reload) and without profile, the account is
            // discarded and the user is sent to /login.
            mockAuth.currentUser = GOOGLE_USER;
            vi.mocked(hasProfile).mockResolvedValue(false);

            const response = await getThrownRedirect(completeProfileLoader);

            expect(discardIncompleteAccount).toHaveBeenCalledTimes(1);
            expect(response.headers.get('Location')).toBe('/login');
        });

        it('sends users that already have a profile to /home', async () => {
            // Expected: a redirect to /home and nothing deleted.
            mockAuth.currentUser = VERIFIED_USER;

            const response = await getThrownRedirect(completeProfileLoader);

            expect(response.headers.get('Location')).toBe('/home');
            expect(discardIncompleteAccount).not.toHaveBeenCalled();
        });

        it('signs out and redirects to /login when the API fails', async () => {
            // Expected: logout() called, nothing deleted, and a redirect to /login.
            mockAuth.currentUser = GOOGLE_USER;
            vi.mocked(hasProfile).mockRejectedValue(new Error('Ha ocurrido un error inesperado.'));

            const response = await getThrownRedirect(completeProfileLoader);

            expect(logout).toHaveBeenCalledTimes(1);
            expect(discardIncompleteAccount).not.toHaveBeenCalled();
            expect(response.headers.get('Location')).toBe('/login');
        });
    });

    describe('loginLoader', () => {
        it('returns the masked email after a registration', () => {
            // Expected: { registeredEmail: "a***x@example.com" }.
            vi.mocked(consumeRegisteredFlash).mockReturnValue('a***x@example.com');

            expect(loginLoader()).toEqual({registeredEmail: 'a***x@example.com'});
        });

        it('returns null in a normal visit', () => {
            // Expected: { registeredEmail: null }.
            vi.mocked(consumeRegisteredFlash).mockReturnValue(null);

            expect(loginLoader()).toEqual({registeredEmail: null});
        });
    });

    describe('homeLoader', () => {
        it('returns the dashboard data from the service', async () => {
            // Expected: exactly the data returned by getDashboardData().
            const dashboard = {topPerformers: []} as unknown as DashboardData;
            vi.mocked(getDashboardData).mockResolvedValue(dashboard);

            await expect(homeLoader()).resolves.toBe(dashboard);
        });
    });
});
