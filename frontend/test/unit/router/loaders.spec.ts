import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRegisteredFlash } from '../../../src/router/flash-messages';
import {
    homeLoader,
    loginLoader,
    protectedLoader,
    redirectIfAuthenticatedLoader
} from '../../../src/router/loaders';
import { getProfile, logout, type UserProfile } from '../../../src/services/auth.service';
import {
    getDashboardData,
    getManagerSummary,
    type DashboardData,
    type ManagerSummary
} from '../../../src/services/dashboard.service';

// Mutable fake of the Firebase auth instance: each test decides whether there is a logged-in user.
const mockAuth = vi.hoisted(() => ({
    currentUser: null as User | null,
    authStateReady: vi.fn()
}));

vi.mock('../../../src/config/firebase', () => ({auth: mockAuth}));
vi.mock('../../../src/services/auth.service', () => ({
    getProfile: vi.fn(),
    logout: vi.fn()
}));
vi.mock('../../../src/services/dashboard.service', () => ({
    getDashboardData: vi.fn(),
    getManagerSummary: vi.fn()
}));
vi.mock('../../../src/router/flash-messages', () => ({
    consumeRegisteredFlash: vi.fn()
}));

const LOGGED_USER = {uid: 'firebase-uid-1'} as User;
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
        vi.mocked(getProfile).mockResolvedValue(PROFILE);
        vi.mocked(getManagerSummary).mockResolvedValue(SUMMARY);
        vi.mocked(logout).mockResolvedValue(undefined);
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
            mockAuth.currentUser = LOGGED_USER;

            await expect(protectedLoader()).resolves.toEqual({profile: PROFILE, summary: SUMMARY});
        });

        it('waits for Firebase to restore the session before checking the user', async () => {
            // Expected: the loader sees the restored user and returns the data instead of redirecting.
            mockAuth.authStateReady.mockImplementation(async () => {
                mockAuth.currentUser = LOGGED_USER;
            });

            await expect(protectedLoader()).resolves.toEqual({profile: PROFILE, summary: SUMMARY});
            expect(mockAuth.authStateReady).toHaveBeenCalledTimes(1);
        });

        it('signs out and redirects to /login when the profile cannot be loaded', async () => {
            // Expected: logout() called (avoids a redirect loop with the auth pages) and a redirect to /login.
            mockAuth.currentUser = LOGGED_USER;
            vi.mocked(getProfile).mockRejectedValue(new Error('User not found'));

            const response = await getThrownRedirect(protectedLoader);

            expect(logout).toHaveBeenCalledTimes(1);
            expect(response.headers.get('Location')).toBe('/login');
        });
    });

    describe('redirectIfAuthenticatedLoader', () => {
        it('redirects to /home when there is a session', async () => {
            // Expected: a 302 redirect to /home.
            mockAuth.currentUser = LOGGED_USER;

            const response = await getThrownRedirect(redirectIfAuthenticatedLoader);

            expect(response.status).toBe(302);
            expect(response.headers.get('Location')).toBe('/home');
        });

        it('lets the page render when there is no session', async () => {
            // Expected: null (no redirect, the auth page is shown).
            await expect(redirectIfAuthenticatedLoader()).resolves.toBeNull();
            expect(mockAuth.authStateReady).toHaveBeenCalledTimes(1);
        });
    });

    describe('loginLoader', () => {
        it('tells the page to show the "account created" message after a registration', () => {
            // Expected: { justRegistered: true }.
            vi.mocked(consumeRegisteredFlash).mockReturnValue(true);

            expect(loginLoader()).toEqual({justRegistered: true});
        });

        it('does not show the message in a normal visit', () => {
            // Expected: { justRegistered: false }.
            vi.mocked(consumeRegisteredFlash).mockReturnValue(false);

            expect(loginLoader()).toEqual({justRegistered: false});
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
