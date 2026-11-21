// Pure functions of the matchday calendar (no database access), shared by the services, the mappers and the DTOs
import { MATCH_DURATION_MS, MATCHDAY_START_WEEKDAY, MATCHDAY_TIMEZONE } from "../config/matchday.constants";

// A matchday of a league: the lineups lock when its first match starts and it ends when its last match ends
export interface Matchday {
    number: number;
    locksAt: Date;
    endsAt: Date;
}

export type MatchdayStatus = 'CLOSED' | 'LIVE' | 'UPCOMING';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const zoneFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: MATCHDAY_TIMEZONE, hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
});

// Calendar date, time and weekday of an instant in the matchday time zone
function zonedParts(date: Date) {
    const parts = Object.fromEntries(zoneFormat.formatToParts(date).map((part) => [part.type, part.value]));
    return {
        year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
        hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
        weekday: WEEKDAYS.indexOf(parts.weekday)
    };
}

// Milliseconds the time zone is ahead of UTC at an instant (+1 h in winter and +2 h in summer for Madrid)
function zoneOffset(utcMs: number): number {
    const p = zonedParts(new Date(utcMs));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000;
}

// Instant of 00:00 of a calendar day in the time zone. The second pass corrects the days when the offset changes.
function zonedMidnight(year: number, month: number, day: number): number {
    const guess = Date.UTC(year, month - 1, day);
    const first = guess - zoneOffset(guess);
    return guess - zoneOffset(first);
}

// Start (Tuesday 00:00 in the time zone) of the matchday window that contains the instant
export function windowStart(date: Date): number {
    const p = zonedParts(date);
    const daysSinceStart = (p.weekday - MATCHDAY_START_WEEKDAY + 7) % 7;
    const start = new Date(Date.UTC(p.year, p.month - 1, p.day) - daysSinceStart * MS_PER_DAY);
    return zonedMidnight(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate());
}

// Groups the kick-offs in Tuesday-Monday windows. Only the windows with matches are matchdays, numbered in order; each
// one locks at its first kick-off and ends when its last match ends (the data has no end times, so its kick-off plus
// MATCH_DURATION_MS).
export function buildCalendar(kickOffs: Date[]): Matchday[] {
    const kickOffsByWindow = new Map<number, {first: number; last: number}>();
    for (const kickOff of kickOffs) {
        const time = kickOff.getTime();
        const start = windowStart(kickOff);
        const current = kickOffsByWindow.get(start);
        kickOffsByWindow.set(start, current
            ? {first: Math.min(current.first, time), last: Math.max(current.last, time)}
            : {first: time, last: time});
    }

    return [...kickOffsByWindow.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, {first, last}], index) => ({
            number: index + 1, locksAt: new Date(first), endsAt: new Date(last + MATCH_DURATION_MS)
        }));
}

// First matchday that has not started yet: the one whose lineups can still be changed
export function findNext(calendar: Matchday[], now: Date): Matchday | null {
    return calendar.find((matchday) => matchday.locksAt.getTime() > now.getTime()) ?? null;
}

// Matchday being played (its first match has started and it has not ended yet)
export function findCurrent(calendar: Matchday[], now: Date): Matchday | null {
    return calendar.find((matchday) =>
        matchday.locksAt.getTime() <= now.getTime() && now.getTime() <= matchday.endsAt.getTime()
    ) ?? null;
}

export function statusOf(matchday: Matchday, now: Date): MatchdayStatus {
    if (matchday.locksAt.getTime() > now.getTime()) return 'UPCOMING';
    return now.getTime() <= matchday.endsAt.getTime() ? 'LIVE' : 'CLOSED';
}
