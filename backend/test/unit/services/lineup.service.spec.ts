import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { availableMatchdays, LineupService } from "../../../src/services/lineup.service";

jest.mock('../../../src/repositories/lineup.repository', () => ({LineupRepository: class LineupRepository {}}));
jest.mock('../../../src/repositories/player-property.repository', () => ({
    PlayerPropertyRepository: class PlayerPropertyRepository {}
}));
jest.mock('../../../src/repositories/sports-data.repository', () => ({SportsDataRepository: class SportsDataRepository {}}));
jest.mock('../../../src/repositories/league-competition.repository', () => ({
    LeagueCompetitionRepository: class LeagueCompetitionRepository {}
}));
jest.mock('../../../src/services/league-access.service', () => ({LeagueAccessService: class LeagueAccessService {}}));
jest.mock('@nestjs/config', () => ({ConfigService: class ConfigService {}}));

const at = (iso: string) => new Date(iso);
// Matchdays 1-4 of the season; the simulated "now" is during matchday 3, so the next one is 4
const CALENDAR = [1, 2, 3, 4].map((number) => ({
    number,
    locksAt: at(`2025-09-${String(number * 7).padStart(2, '0')}T12:00:00Z`),
    endsAt: at(`2025-09-${String(number * 7 + 2).padStart(2, '0')}T21:59:59.999Z`)
}));
const NOW = at('2025-09-22T10:00:00Z');

const MY_TEAM = {id: 50, userId: 7};
const OTHER_TEAM = {id: 60, userId: 8};
// Squad of my team: GK 1, DEF 2, MID 3 and FWD 4 (PlayerProperty ids), external ids 101-104
const SQUAD = [1, 2, 3, 4].map((id) => ({id, externalPlayerId: 100 + id}));
const POSITIONS = new Map([[101, 'GK'], [102, 'DEF'], [103, 'MID'], [104, 'FWD']]);

const lineupRow = (matchday: number, captainId: number | null = null) => ({
    id: 9, teamFantasyId: 50, matchday, formation: '4-3-3', captainId,
    players: [{slot: 'GK1', playerPropertyId: 1}, {slot: 'FWD1', playerPropertyId: 4}]
});

describe('LineupService', () => {
    let service: LineupService;
    let access: {findMembership: jest.Mock; findTeam: jest.Mock};
    let lineups: {findEffective: jest.Mock; saveForMatchday: jest.Mock};
    let calendar: {getCalendar: jest.Mock; now: jest.Mock};
    let league: {id: number; captainEnabled: boolean; firstMatchday: number | null; competitions: {competitionId: number}[]};

    beforeEach(() => {
        league = {id: 3, captainEnabled: true, firstMatchday: 2, competitions: [{competitionId: 119924}]};
        access = {
            findMembership: jest.fn().mockImplementation(() =>
                Promise.resolve({league, myTeam: MY_TEAM, teams: [MY_TEAM, OTHER_TEAM]})),
            findTeam: jest.fn().mockImplementation((_membership, teamId: number) =>
                teamId === 60 ? OTHER_TEAM : MY_TEAM)
        };
        lineups = {
            findEffective: jest.fn().mockResolvedValue(lineupRow(4, 4)),
            saveForMatchday: jest.fn().mockImplementation((teamId: number, matchday: number, data: object) =>
                Promise.resolve({teamFantasyId: teamId, matchday, ...data}))
        };
        calendar = {getCalendar: jest.fn().mockResolvedValue(CALENDAR), now: jest.fn().mockReturnValue(NOW)};
        const players = {findByTeamFantasy: jest.fn().mockResolvedValue(SQUAD)};
        const sportsData = {findPositionGroups: jest.fn().mockResolvedValue(POSITIONS)};
        const dataSource = {transaction: jest.fn().mockImplementation((work: (m: object) => unknown) => work({}))};

        service = new LineupService(
            dataSource as never, access as never, lineups as never, players as never, sportsData as never,
            {findCompetitionIds: jest.fn()} as never, calendar as never
        );
    });

    describe('getLineup', () => {
        it('returns my lineup of the next matchday, editable, with the matchdays of the league', async () => {
            // Expected: matchday 4 (UPCOMING), editable, its captain, and matchdays 2-4 (the league started at 2).
            const result = await service.getLineup('uid-7', 3, 50);

            expect(lineups.findEffective).toHaveBeenCalledWith(50, 4);
            expect(result.matchday).toMatchObject({number: 4, status: 'UPCOMING'});
            expect(result.editable).toBe(true);
            expect(result.captainId).toBe(4);
            expect(result.formation).toBe('4-3-3');
            expect(result.matchdays.map((item) => [item.number, item.status])).toEqual([
                [2, 'CLOSED'], [3, 'LIVE'], [4, 'UPCOMING']
            ]);
        });

        it('keeps the last saved lineup but not its captain on a later matchday', async () => {
            // Expected: the lineup saved for matchday 3 is still in force on matchday 4, without captain.
            lineups.findEffective.mockResolvedValue(lineupRow(3, 4));

            const result = await service.getLineup('uid-7', 3, 50);

            expect(result.players).toHaveLength(2);
            expect(result.captainId).toBeNull();
        });

        it('shows the next lineup of another member, read-only', async () => {
            // Expected: visible (agreed rule) but not editable.
            const result = await service.getLineup('uid-7', 3, 60);

            expect(lineups.findEffective).toHaveBeenCalledWith(60, 4);
            expect(result.editable).toBe(false);
        });

        it('returns a matchday being played as read-only', async () => {
            // Expected: matchday 3 is LIVE, so not editable.
            const result = await service.getLineup('uid-7', 3, 50, 3);

            expect(result.matchday.status).toBe('LIVE');
            expect(result.editable).toBe(false);
        });

        it('leaves out the starters sold since the next lineup was saved', async () => {
            // Expected: player 4 is no longer in the squad, so only the goalkeeper remains and the captain is removed.
            lineups.findEffective.mockResolvedValue(lineupRow(4, 4));
            const players = {findByTeamFantasy: jest.fn().mockResolvedValue(SQUAD.slice(0, 3))};
            service = new LineupService(
                {} as never, access as never, lineups as never, players as never,
                {findPositionGroups: jest.fn().mockResolvedValue(POSITIONS)} as never, {} as never, calendar as never
            );

            const result = await service.getLineup('uid-7', 3, 50);

            expect(result.players).toEqual([{slot: 'GK1', playerPropertyId: 1}]);
            expect(result.captainId).toBeNull();
        });

        it('gives an empty 4-4-2 to a team without saved lineups', async () => {
            // Expected: default formation and no starters.
            lineups.findEffective.mockResolvedValue(null);

            const result = await service.getLineup('uid-7', 3, 50);

            expect(result).toMatchObject({formation: '4-4-2', players: [], captainId: null});
        });

        it('rejects a matchday before the league started or after the next one', async () => {
            // Expected: BadRequestException for matchday 1 (the league starts at 2) and for matchday 5.
            await expect(service.getLineup('uid-7', 3, 50, 1)).rejects.toThrow(BadRequestException);
            await expect(service.getLineup('uid-7', 3, 50, 5)).rejects.toThrow(BadRequestException);
        });

        it('rejects a league without matchdays', async () => {
            // Expected: NotFoundException while the calendar is empty.
            calendar.getCalendar.mockResolvedValue([]);

            await expect(service.getLineup('uid-7', 3, 50)).rejects.toThrow(NotFoundException);
        });
    });

    describe('saveLineup', () => {
        const DTO = {formation: '4-3-3', captainId: 4, players: [
            {slot: 'GK1', playerPropertyId: 1}, {slot: 'DEF1', playerPropertyId: 2}, {slot: 'FWD1', playerPropertyId: 4}
        ]};

        it('saves my lineup for the next matchday', async () => {
            // Expected: saved for team 50 and matchday 4 with the captain; the response says matchday 4 and editable.
            const result = await service.saveLineup('uid-7', 3, DTO);

            expect(lineups.saveForMatchday).toHaveBeenCalledWith(50, 4, {
                formation: '4-3-3', captainId: 4, players: DTO.players
            }, {});
            expect(result.matchday.number).toBe(4);
            expect(result.editable).toBe(true);
            expect(result.captainId).toBe(4);
        });

        it('rejects an invalid lineup without saving it', async () => {
            // Expected: BadRequestException for a forward in a defender slot; nothing saved.
            const dto = {...DTO, players: [{slot: 'DEF1', playerPropertyId: 4}], captainId: null};

            await expect(service.saveLineup('uid-7', 3, dto)).rejects.toThrow(BadRequestException);
            expect(lineups.saveForMatchday).not.toHaveBeenCalled();
        });

        it('rejects a captain in a league without captain', async () => {
            // Expected: BadRequestException.
            league.captainEnabled = false;

            await expect(service.saveLineup('uid-7', 3, DTO)).rejects.toThrow(BadRequestException);
        });

        it('rejects saving once the season has ended', async () => {
            // Expected: ConflictException after the last matchday started.
            calendar.now.mockReturnValue(at('2025-12-01T10:00:00Z'));

            await expect(service.saveLineup('uid-7', 3, DTO)).rejects.toThrow(ConflictException);
        });
    });
});

describe('availableMatchdays', () => {
    it('goes from the first matchday of the league to the next one', () => {
        // Expected: matchdays 2, 3 and 4.
        expect(availableMatchdays(CALENDAR, 2, CALENDAR[3]).map((item) => item.number)).toEqual([2, 3, 4]);
    });

    it('goes to the last matchday when the season has ended', () => {
        // Expected: matchdays 3 and 4.
        expect(availableMatchdays(CALENDAR, 3, null).map((item) => item.number)).toEqual([3, 4]);
    });
});
