import { describe, expect, it } from 'vitest';
import {
    formatNumber,
    formatPositionLabel,
    formatPrice,
    formatTimeRemaining,
    getInitials
} from '../../../src/utils/format';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// Fixed "now" so results never depend on the real clock.
const NOW = new Date('2026-10-09T12:00:00Z').getTime();

describe('formatTimeRemaining', () => {
    it('formats a future date as days, hours and minutes', () => {
        // Tests: a deadline 1 day, 14 hours and 42 minutes after "now".
        // Expected: "1d 14h 42m".
        const deadline = new Date(NOW + DAY + 14 * HOUR + 42 * MINUTE).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('1d 14h 42m');
    });

    it('ignores the seconds left over after the last full minute', () => {
        // Tests: 5 minutes and 59 seconds remaining.
        // Expected: "0d 0h 5m" (incomplete minutes are not rounded up).
        const deadline = new Date(NOW + 5 * MINUTE + 59_000).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 5m');
    });

    it('returns zero when less than a minute is left', () => {
        // Tests: 30 seconds remaining.
        // Expected: "0d 0h 0m".
        const deadline = new Date(NOW + 30_000).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 0m');
    });

    it('returns zero when the date already passed', () => {
        // Tests: a deadline 2 hours before "now".
        // Expected: "0d 0h 0m" instead of negative values.
        const deadline = new Date(NOW - 2 * HOUR).toISOString();

        expect(formatTimeRemaining(deadline, NOW)).toBe('0d 0h 0m');
    });
});

describe('getInitials', () => {
    it('returns the first letter of the first two words in upper case', () => {
        // Tests: a two-word name in lower case.
        // Expected: "AM".
        expect(getInitials('apex manager')).toBe('AM');
    });

    it('returns a single letter for a single word', () => {
        // Tests: a one-word name.
        // Expected: "U".
        expect(getInitials('UltraStriker')).toBe('U');
    });

    it('uses only the first two words of longer names', () => {
        // Tests: a three-word name.
        // Expected: "JC" (the third word is ignored).
        expect(getInitials('Juan Carlos Pérez')).toBe('JC');
    });

    it('ignores extra spaces between and around words', () => {
        // Tests: a name with leading, trailing and repeated spaces.
        // Expected: "AM" (empty fragments are discarded).
        expect(getInitials('  Apex   Manager  ')).toBe('AM');
    });
});

describe('formatPrice', () => {
    it('formats millions with one decimal and the pound sign', () => {
        // Tests: a price with one decimal.
        // Expected: "£12.4M".
        expect(formatPrice(12.4)).toBe('£12.4M');
    });

    it('always shows one decimal, even for whole numbers', () => {
        // Tests: a whole price.
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
        // Tests: every position code used by the data.
        // Expected: its Spanish abbreviation shown in the UI.
        expect(formatPositionLabel(position)).toBe(label);
    });
});

describe('formatNumber', () => {
    it('uses the Spanish thousands separator for five-digit numbers', () => {
        // Tests: a five-digit number.
        // Expected: "12.345" (dot as thousands separator, es-ES format).
        expect(formatNumber(12345)).toBe('12.345');
    });

    it('does not group four-digit numbers, following the es-ES convention', () => {
        // Tests: a four-digit number.
        // Expected: "1524" (the Spanish locale only groups from five digits on).
        expect(formatNumber(1524)).toBe('1524');
    });
});
