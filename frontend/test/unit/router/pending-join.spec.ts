import { describe, expect, it, vi } from 'vitest';
import {
    consumePendingJoinCode,
    getPostLoginPath,
    peekPendingJoinCode,
    savePendingJoinCode
} from '../../../src/router/pending-join';

describe('pending join code', () => {
    it('stores the code in capital letters and without spaces', () => {
        // Expected: "A7KQ2M" stored.
        savePendingJoinCode(' a7kq2m ');

        expect(peekPendingJoinCode()).toBe('A7KQ2M');
    });

    it('can be read several times with peek but only once with consume', () => {
        // Expected: peek keeps the code; consume returns it and then null.
        savePendingJoinCode('A7KQ2M');

        expect(peekPendingJoinCode()).toBe('A7KQ2M');
        expect(consumePendingJoinCode()).toBe('A7KQ2M');
        expect(consumePendingJoinCode()).toBeNull();
    });

    it('is null when no invitation link was opened', () => {
        // Expected: null.
        expect(peekPendingJoinCode()).toBeNull();
    });

    it('does not fail when the storage is unavailable', () => {
        // Expected: no exception, a warning in the console and no code stored.
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage blocked');
        });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(() => savePendingJoinCode('A7KQ2M')).not.toThrow();
        expect(warn).toHaveBeenCalled();
        expect(peekPendingJoinCode()).toBeNull();
    });
});

describe('getPostLoginPath', () => {
    it('goes to the dashboard after a normal login', () => {
        // Expected: "/home".
        expect(getPostLoginPath()).toBe('/home');
    });

    it('goes to the leagues page when an invitation is waiting', () => {
        // Expected: "/leagues".
        savePendingJoinCode('A7KQ2M');

        expect(getPostLoginPath()).toBe('/leagues');
    });
});
