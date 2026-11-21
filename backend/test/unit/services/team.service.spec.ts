import { TeamService } from "../../../src/services/team.service";

jest.mock('../../../src/repositories/player-property.repository', () => ({
    PlayerPropertyRepository: class PlayerPropertyRepository {}
}));
jest.mock('../../../src/repositories/sports-data.repository', () => ({SportsDataRepository: class SportsDataRepository {}}));
jest.mock('../../../src/services/league-access.service', () => ({LeagueAccessService: class LeagueAccessService {}}));

const M = 1_000_000;
const MY_TEAM = {id: 50, name: 'Galácticos', userId: 7, user: {name: 'Ana'}, totalPoints: 30, budget: 3 * M};
const OTHER_TEAM = {id: 60, name: 'Real Patatas', userId: 8, user: {name: 'Lucía'}, totalPoints: 45, budget: 9 * M};
const ACQUIRED = new Date('2026-11-10T10:00:00Z');
// Squad of the other team: a cheap forward, a goalkeeper and two defenders
const PLAYERS = [
    {id: 1, externalPlayerId: 101, marketValue: 5 * M, clauseValue: 8 * M, acquiredAt: ACQUIRED},
    {id: 2, externalPlayerId: 102, marketValue: 20 * M, clauseValue: 25 * M, acquiredAt: ACQUIRED},
    {id: 3, externalPlayerId: 103, marketValue: 12 * M, clauseValue: 15 * M, acquiredAt: ACQUIRED},
    {id: 4, externalPlayerId: 104, marketValue: 30 * M, clauseValue: 38 * M, acquiredAt: ACQUIRED}
];
const POSITIONS = new Map([[101, 'FWD'], [102, 'GK'], [103, 'DEF'], [104, 'DEF']]);
const CARDS = new Map([[101, {externalPlayerId: 101, name: 'Wissa', teamName: 'Newcastle'}]]);

describe('TeamService', () => {
    let service: TeamService;
    let access: {findMembership: jest.Mock; findTeam: jest.Mock};

    beforeEach(() => {
        access = {
            // Ranking: the other team first (45 points), mine second
            findMembership: jest.fn().mockResolvedValue({myTeam: MY_TEAM, teams: [OTHER_TEAM, MY_TEAM]}),
            findTeam: jest.fn().mockImplementation((_membership, teamId: number) => teamId === 60 ? OTHER_TEAM : MY_TEAM)
        };
        const players = {findByTeamFantasy: jest.fn().mockResolvedValue(PLAYERS)};
        const sportsData = {
            findPlayerCards: jest.fn().mockResolvedValue(CARDS),
            findPositionGroups: jest.fn().mockResolvedValue(POSITIONS)
        };
        service = new TeamService(access as never, players as never, sportsData as never);
    });

    it('returns another member\'s team with its rank and whole squad, but without its budget', async () => {
        // Expected: rank 1, 4 players with value and clause, budget hidden and isMine false.
        const result = await service.getTeam('uid-7', 3, 60);

        expect(result).toMatchObject({
            id: 60, name: 'Real Patatas', userName: 'Lucía', rank: 1, totalPoints: 45, isMine: false, budget: null,
            playersCount: 4, maxPlayers: 23
        });
        expect(result.squad[0]).toMatchObject({playerPropertyId: 2, marketValue: 20 * M, clauseValue: 25 * M});
    });

    it('orders the squad by position (GK, DEF, MID, FWD) and then by value', async () => {
        // Expected: goalkeeper 2, defenders 4 (30M) and 3 (12M), forward 1.
        const result = await service.getTeam('uid-7', 3, 60);

        expect(result.squad.map((player) => player.playerPropertyId)).toEqual([2, 4, 3, 1]);
        expect(result.squad[3]).toMatchObject({name: 'Wissa', teamName: 'Newcastle', acquiredAt: ACQUIRED});
    });

    it('shows the budget of my own team', async () => {
        // Expected: rank 2, isMine and the budget of 3M.
        const result = await service.getTeam('uid-7', 3, 50);

        expect(result).toMatchObject({rank: 2, isMine: true, budget: 3 * M});
    });
});
