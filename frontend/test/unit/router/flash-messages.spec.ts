import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRegisteredFlash, setRegisteredFlash } from '../../../src/router/flash-messages';

describe('registered flash message', () => {
    beforeEach(() => {
        // Storage failures are logged on purpose; silence them to keep the test output clean.
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('is not set by default', () => {
        // Expected: false.
        expect(consumeRegisteredFlash()).toBe(false);
    });

    it('is read once after being set', () => {
        // Expected: true, because an account was just created.
        setRegisteredFlash();

        expect(consumeRegisteredFlash()).toBe(true);
    });

    it('is removed after being read, so it is only shown once', () => {
        // Expected: true the first time and false the second time (e.g. after reloading /login).
        setRegisteredFlash();
        consumeRegisteredFlash();

        expect(consumeRegisteredFlash()).toBe(false);
    });

    it('stores the flag in sessionStorage, not in the URL', () => {
        // Expected: one entry in sessionStorage with value "1".
        setRegisteredFlash();

        expect(sessionStorage.length).toBe(1);
        expect(sessionStorage.getItem(sessionStorage.key(0)!)).toBe('1');
    });

    it('does not crash when sessionStorage cannot be written', () => {
        // Expected: no exception, and a warning in the console.
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });

        expect(() => setRegisteredFlash()).not.toThrow();
        expect(console.warn).toHaveBeenCalled();
    });

    it('returns false when sessionStorage cannot be read', () => {
        // Expected: false (the optional message is simply not shown) and no exception.
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });

        expect(consumeRegisteredFlash()).toBe(false);
    });
});
