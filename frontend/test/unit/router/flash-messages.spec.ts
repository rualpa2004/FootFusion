import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRegisteredFlash, setRegisteredFlash } from '../../../src/router/flash-messages';

describe('registered flash message', () => {
    beforeEach(() => {
        // Storage failures are logged on purpose; silence them to keep the test output clean.
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('is not set by default', () => {
        // Expected: null.
        expect(consumeRegisteredFlash()).toBeNull();
    });

    it('returns the masked email once after being set', () => {
        // Expected: the masked email of the account just created.
        setRegisteredFlash('a***x@example.com');

        expect(consumeRegisteredFlash()).toBe('a***x@example.com');
    });

    it('is removed after being read, so it is only shown once', () => {
        // Expected: the email the first time and null the second time (e.g. after reloading /login).
        setRegisteredFlash('a***x@example.com');
        consumeRegisteredFlash();

        expect(consumeRegisteredFlash()).toBeNull();
    });

    it('stores the masked email in sessionStorage, not in the URL', () => {
        // Expected: one entry in sessionStorage with the masked email as value.
        setRegisteredFlash('a***x@example.com');

        expect(sessionStorage.length).toBe(1);
        expect(sessionStorage.getItem(sessionStorage.key(0)!)).toBe('a***x@example.com');
    });

    it('does not crash when sessionStorage cannot be written', () => {
        // Expected: no exception, and a warning in the console.
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });

        expect(() => setRegisteredFlash('a***x@example.com')).not.toThrow();
        expect(console.warn).toHaveBeenCalled();
    });

    it('returns null when sessionStorage cannot be read', () => {
        // Expected: null (the optional message is simply not shown) and no exception.
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });

        expect(consumeRegisteredFlash()).toBeNull();
    });
});
