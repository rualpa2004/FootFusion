import { afterEach, describe, expect, it } from 'vitest';
import {
    clearGoogleSignUpPending,
    isGoogleSignUpPending,
    markGoogleSignUpPending
} from '../../../src/router/google-sign-up';

describe('pending Google sign-up', () => {
    afterEach(() => {
        clearGoogleSignUpPending();
    });

    it('is not pending by default', () => {
        // Expected: false (e.g. after reloading the page).
        expect(isGoogleSignUpPending()).toBe(false);
    });

    it('is pending after being marked', () => {
        // Expected: true right after a first Google sign-in.
        markGoogleSignUpPending();

        expect(isGoogleSignUpPending()).toBe(true);
    });

    it('stops being pending when it is cleared', () => {
        // Expected: false once the sign-up is completed or cancelled.
        markGoogleSignUpPending();
        clearGoogleSignUpPending();

        expect(isGoogleSignUpPending()).toBe(false);
    });

    it('is not stored in the browser storage', () => {
        // Expected: sessionStorage stays empty, so the mark is lost on reload on purpose.
        markGoogleSignUpPending();

        expect(sessionStorage.length).toBe(0);
    });
});
