import { describe, expect, it } from 'vitest';
import {
    formatNumber,
    formatPositionLabel,
    formatPrice,
    formatTimeRemaining,
    maskEmail
} from '../../../src/utils/format';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// Fixed "now" so results never depend on the real clock.
const NOW = new Date('2026-10-09T12:00:00Z').getTime();

describe('formatTimeRemaining', () => {
    it('formats a future date as days, hours and minutes', () => {
        // Expected: "1d 14h 42m".
        const deadline = new Date(NOW + DAY + 14 * HOUR + 42 * MINUTE).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('1d 14h 42m');
    });

    it('ignores the seconds left over after the last full minute', () => {
        // Expected: "0d 0h 5m" (incomplete minutes are not rounded up).
        const deadline = new Date(NOW + 5 * MINUTE + 59_000).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 5m');
    });

    it('returns zero when less than a minute is left', () => {
        // Expected: "0d 0h 0m".
        const deadline = new Date(NOW + 30_000).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 0m');
    });

    it('returns zero when the date already passed', () => {
        // Expected: "0d 0h 0m" instead of negative values.
        const deadline = new Date(NOW - 2 * HOUR).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 0m');
    });
});

describe('maskEmail', () => {
    it('keeps only the first and last characters before the @', () => {
        // Expected: "r***4@gmail.com".
        expect(maskEmail('rualpa2004@gmail.com')).toBe('r***4@gmail.com');
    });

    it('keeps the whole domain', () => {
        // Expected: only the part before the @ is hidden.
        expect(maskEmail('apex.manager@example.co.uk')).toBe('a***r@example.co.uk');
    });

    it('does not repeat the character when the part before the @ has only one', () => {
        // Expected: "a***@example.com".
        expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });

    it('returns the text unchanged when it is not an email', () => {
        // Expected: the same text (nothing to mask).
        expect(maskEmail('not-an-email')).toBe('not-an-email');
    });
});

describe('formatPrice', () => {
    it('formats millions with one decimal and the pound sign', () => {
        // Expected: "£12.4M".
        expect(formatPrice(12.4)).toBe('£12.4M');
    });

    it('always shows one decimal, even for whole numbers', () => {
        // Expected: "£8.0M".
        expect(formatPrice(8)).toBe('£8.0M');
    });
});

describe('formatPositionLabel', () => {
    it.each([
        ['GK', 'POR'],
        ['DEF', 'DEF'],
        ['MID', 'MED'],
        ['FWD', 'DEL']
    ] as const)('translates %s into %s', (position, label) => {
        // Expected: its Spanish abbreviation shown in the UI.
        expect(formatPositionLabel(position)).toBe(label);
    });
});

describe('formatNumber', () => {
    it('uses the Spanish thousands separator for five-digit numbers', () => {
        // Expected: "12.345" (dot as thousands separator, es-ES format).
        expect(formatNumber(12345)).toBe('12.345');
    });

    it('does not group four-digit numbers, following the es-ES convention', () => {
        // Expected: "1524" (the Spanish locale only groups from five digits on).
        expect(formatNumber(1524)).toBe('1524');
    });
});
