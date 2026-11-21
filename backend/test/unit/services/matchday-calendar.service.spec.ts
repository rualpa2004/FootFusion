import { MatchdayCalendarService } from "../../../src/services/matchday-calendar.service";
import { buildCalendar, findCurrent, findNext, statusOf, windowStart } from "../../../src/services/matchday-rules";

jest.mock('../../../src/repositories/sports-data.repository', () => ({SportsDataRepository: class SportsDataRepository {}}));
// The clock only needs the ConfigService type
jest.mock('@nestjs/config', () => ({ConfigService: class ConfigService {}}));

const at = (iso: string) => new Date(iso);

describe('windowStart', () => {
    it('places a Monday night match in the window that started the previous Tuesday', () => {
        // Expected: Monday 17/11/2025 23:30 in Madrid (22:30 UTC, winter time) belongs to the window of Tuesday
        // 11/11/2025 00:00 in Madrid, which is 10/11 23:00 UTC.
        expect(windowStart(at('2025-11-17T22:30:00Z'))).toBe(at('2025-11-10T23:00:00Z').getTime());
    });

    it('starts a new window on Tuesday at 00:00 Madrid time', () => {
        // Expected: Tuesday 18/11/2025 00:30 in Madrid (17/11 23:30 UTC) opens the window of 18/11.
        expect(windowStart(at('2025-11-17T23:30:00Z'))).toBe(at('2025-11-17T23:00:00Z').getTime());
    });

    it('uses the summer offset of Madrid', () => {
        // Expected: Tuesday 23/09/2025 at noon belongs to its own window, which starts at 22/09 22:00 UTC (UTC+2).
        expect(windowStart(at('2025-09-23T10:00:00Z'))).toBe(at('2025-09-22T22:00:00Z').getTime());
    });
});

describe('buildCalendar', () => {
    const kickOffs = [
        at('2025-08-29T19:00:00Z'),     // Friday of the third week
        at('2025-08-17T17:00:00Z'),     // Sunday of the first week
        at('2025-08-15T19:00:00Z'),     // Friday of the first week: first match of the season
        at('2025-08-27T19:00:00Z')      // Wednesday of the third week
    ];

    it('groups the matches by week, numbers only the weeks with matches, locks at the first kick-off and ends with the last match', () => {
        // Expected: 2 matchdays (the week of 19/08 has no matches and is not a matchday). Matchday 1 locks on Friday
        // 15/08 at 19:00 UTC and ends 2 hours after the Sunday 17/08 kick-off; matchday 2 locks on Wednesday 27/08 and
        // ends 2 hours after the Friday 29/08 kick-off.
        expect(buildCalendar(kickOffs)).toEqual([
            {number: 1, locksAt: at('2025-08-15T19:00:00Z'), endsAt: at('2025-08-17T19:00:00Z')},
            {number: 2, locksAt: at('2025-08-27T19:00:00Z'), endsAt: at('2025-08-29T21:00:00Z')}
        ]);
    });

    it('ends a matchday of a single match 2 hours after its kick-off', () => {
        // Expected: the match of Saturday 25/10/2025 at 14:00 UTC locks and ends the matchday at 14:00 and 16:00 UTC.
        expect(buildCalendar([at('2025-10-25T14:00:00Z')])).toEqual([
            {number: 1, locksAt: at('2025-10-25T14:00:00Z'), endsAt: at('2025-10-25T16:00:00Z')}
        ]);
    });

    it('returns no matchdays without matches', () => {
        // Expected: an empty calendar.
        expect(buildCalendar([])).toEqual([]);
    });
});

describe('findNext, findCurrent and statusOf', () => {
    const calendar = [
        {number: 1, locksAt: at('2025-08-15T19:00:00Z'), endsAt: at('2025-08-17T19:00:00Z')},
        {number: 2, locksAt: at('2025-08-27T19:00:00Z'), endsAt: at('2025-08-29T21:00:00Z')}
    ];

    it('during a matchday: it is the current one and the next one is the following matchday', () => {
        // Expected: on Saturday 16/08 matchday 1 is LIVE and matchday 2 is the next (UPCOMING) one.
        const now = at('2025-08-16T10:00:00Z');
        expect(findCurrent(calendar, now)?.number).toBe(1);
        expect(findNext(calendar, now)?.number).toBe(2);
        expect(statusOf(calendar[0], now)).toBe('LIVE');
        expect(statusOf(calendar[1], now)).toBe('UPCOMING');
    });

    it('once the last match has ended the matchday is closed, even before Monday', () => {
        // Expected: on Sunday 17/08 at 19:00:01 UTC (after the last match) matchday 1 is CLOSED and there is no current one.
        const now = at('2025-08-17T19:00:01Z');
        expect(statusOf(calendar[0], now)).toBe('CLOSED');
        expect(findCurrent(calendar, now)).toBeNull();
    });

    it('between matchdays: there is no current matchday and the finished one is closed', () => {
        // Expected: on 20/08 no matchday is being played, matchday 1 is CLOSED and matchday 2 is next.
        const now = at('2025-08-20T10:00:00Z');
        expect(findCurrent(calendar, now)).toBeNull();
        expect(findNext(calendar, now)?.number).toBe(2);
        expect(statusOf(calendar[0], now)).toBe('CLOSED');
    });

    it('before the first kick-off of a matchday it can still be edited', () => {
        // Expected: one second before the first match, matchday 1 is still the next one.
        expect(findNext(calendar, at('2025-08-15T18:59:59Z'))?.number).toBe(1);
    });

    it('after the last matchday there is no next one', () => {
        // Expected: null once the season has ended.
        expect(findNext(calendar, at('2025-09-10T10:00:00Z'))).toBeNull();
    });
});

describe('MatchdayCalendarService', () => {
    let findMatchDates: jest.Mock;
    let service: MatchdayCalendarService;

    beforeEach(() => {
        findMatchDates = jest.fn().mockResolvedValue([at('2025-08-15T19:00:00Z'), at('2025-08-27T19:00:00Z')]);
        const clock = {now: () => at('2025-08-20T10:00:00Z')};
        service = new MatchdayCalendarService({findMatchDates} as never, clock as never);
    });

    it('reads the calendar of a combination of competitions once', async () => {
        // Expected: the same competitions in another order use the calendar already built; MongoDB is read once.
        await service.getCalendar([2486, 119924]);
        const calendar = await service.getCalendar([119924, 2486]);

        expect(calendar).toHaveLength(2);
        expect(findMatchDates).toHaveBeenCalledTimes(1);
    });

    it('does not keep an empty calendar, so it is read again when the ETL loads the fixtures', async () => {
        // Expected: two reads while MongoDB has no matches.
        findMatchDates.mockResolvedValue([]);

        await service.getCalendar([119924]);
        await service.getCalendar([119924]);

        expect(findMatchDates).toHaveBeenCalledTimes(2);
    });

    it('gives the next matchday with the simulated clock', async () => {
        // Expected: on the simulated 20/08 the next matchday is 2.
        expect((await service.getNext([119924]))?.number).toBe(2);
    });
});
