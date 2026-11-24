import { describe, expect, it } from 'vitest';
import {
    formatDate,
    formatEuros,
    formatMatchdayTime,
    formatMillions,
    formatNumber,
    formatPositionLabel,
    formatPrice,
    formatRank,
    formatSignedPoints,
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

describe('formatEuros', () => {
    it('always groups the thousands, also with four digits', () => {
        // Expected: "100.000.000 €" and "1.500 €".
        expect(formatEuros(100_000_000)).toBe('100.000.000 €');
        expect(formatEuros(1500)).toBe('1.500 €');
    });
});

describe('formatMillions', () => {
    it('shows millions with up to two decimals', () => {
        // Expected: "14 M€", "12,5 M€" and "16,25 M€".
        expect(formatMillions(14_000_000)).toBe('14 M€');
        expect(formatMillions(12_500_000)).toBe('12,5 M€');
        expect(formatMillions(16_250_000)).toBe('16,25 M€');
    });
});

describe('formatSignedPoints', () => {
    it('adds the sign to positive and negative points', () => {
        // Expected: "+3" and "−2" (minus sign, not a hyphen).
        expect(formatSignedPoints(3)).toBe('+3');
        expect(formatSignedPoints(-2)).toBe('−2');
    });
});

describe('formatDate', () => {
    it('formats a date as dd/mm/yyyy', () => {
        // Expected: "11/11/2026".
        expect(formatDate('2026-11-11T10:00:00.000Z')).toBe('11/11/2026');
    });
});

describe('formatMatchdayTime', () => {
    it('shows the weekday, the date and the time in Spanish time', () => {
        // Expected: 17:45 UTC on Tuesday 25/11/2025 is 18:45 in Madrid (winter, UTC+1).
        expect(formatMatchdayTime('2025-11-25T17:45:00.000Z')).toBe('martes 25/11 a las 18:45');
    });

    it('uses the summer offset of Madrid', () => {
        // Expected: 12:00 UTC on Saturday 23/08/2025 is 14:00 in Madrid (summer, UTC+2).
        expect(formatMatchdayTime('2025-08-23T12:00:00.000Z')).toBe('sábado 23/08 a las 14:00');
    });
});

describe('formatRank', () => {
    it('adds the ordinal mark', () => {
        // Expected: "2.º".
        expect(formatRank(2)).toBe('2.º');
    });
});
