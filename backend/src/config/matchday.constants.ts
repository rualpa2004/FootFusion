// Matchdays: every match of the league's competitions between Tuesday 00:00 and Monday 23:59:59 (Madrid time) belongs to
// the same matchday. Weeks without matches of those competitions are not matchdays.
export const MATCHDAY_TIMEZONE = 'Europe/Madrid';
export const MATCHDAY_START_WEEKDAY = 2;      // Tuesday (0 = Sunday)

export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

// The data belongs to a past season, so the game runs on a simulated clock: real date minus this number of days.
export const DEFAULT_SIMULATED_DATE_OFFSET_DAYS = 365;

// The calendar only changes when the ETL loads new fixtures, so it is kept in memory for a while
export const CALENDAR_CACHE_TTL_MS = 60 * 60 * 1000;
