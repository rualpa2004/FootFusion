import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { LeagueService } from "../../../src/services/league.service";
import { initialClause, SquadCandidate } from "../../../src/services/squad-assignment.service";
import { CreateLeagueDTO } from "../../../src/dtos/league/create-league.dto";
import { MultiplierTarget } from "../../../src/entities/league.entity";
import { PositionGroup } from "../../../src/config/league.constants";

jest.mock('../../../src/repositories/league.repository', () => ({LeagueRepository: class LeagueRepository {}}));
jest.mock('../../../src/repositories/league-competition.repository', () => ({
    LeagueCompetitionRepository: class LeagueCompetitionRepository {}
}));
jest.mock('../../../src/repositories/league-scoring.repository', () => ({
    LeagueScoringRepository: class LeagueScoringRepository {}
}));
jest.mock('../../../src/repositories/league-ban.repository', () => ({LeagueBanRepository: class LeagueBanRepository {}}));
jest.mock('../../../src/repositories/team-fantasy.repository', () => ({
    TeamFantasyRepository: class TeamFantasyRepository {}
}));
jest.mock('../../../src/repositories/player-property.repository', () => ({
    PlayerPropertyRepository: class PlayerPropertyRepository {}
}));
jest.mock('../../../src/repositories/user.repository', () => ({UserRepository: class UserRepository {}}));
jest.mock('../../../src/repositories/ban.repository', () => ({BanRepository: class BanRepository {}}));
jest.mock('../../../src/repositories/sports-data.repository', () => ({SportsDataRepository: class SportsDataRepository {}}));

const M = 1_000_000;
const USER = {id: 7, name: 'Ana', firebaseUid: 'uid-7'};
const SCORING = {
    minutesMaxPoints: 3, forwardGoalPoints: 4, assistPoints: 3, defenderCleanSheetPoints: 4, goalsConcededPenalty: -1,
    yellowCardPenalty: -1, redCardPenalty: -2, missedPenaltyPenalty: -2, ownGoalPenalty: -2, duelsWonPoints: 1,
    foulsCommittedPenalty: -1
};
const LALIGA = {id: 119924, name: 'La Liga', logo: 'laliga.png', countryName: 'Spain'};
const CHAMPIONS = {id: 2486, name: 'UEFA Champions League', logo: 'cl.png', countryName: 'World'};

// 20 eligible players: 3 GK, 7 DEF, 5 MID and 5 FWD with values from 5M to 24M
const POSITIONS: PositionGroup[] = ['GK', 'GK', 'GK', ...Array<PositionGroup>(7).fill('DEF'),
    ...Array<PositionGroup>(5).fill('MID'), ...Array<PositionGroup>(5).fill('FWD')];
const ELIGIBLE = POSITIONS.map((positionGroup, index) => ({
    externalPlayerId: 100 + index, positionGroup, marketValue: (5 + index) * M
}));

const buildDto = (overrides: Partial<CreateLeagueDTO> = {}): CreateLeagueDTO => ({
    name: '  Liga de amigos  ',
    competitionIds: [LALIGA.id, CHAMPIONS.id],
    scoring: {...SCORING},
    pointReward: 200_000,
    captainEnabled: true,
    multipliers: {enabled: false},
    ...overrides
});

describe('LeagueService', () => {
    let service: LeagueService;
    let manager: object;
    let repositories: Record<string, Record<string, jest.Mock>>;
    let squadAssignment: {draw: jest.Mock};
    let freeAgents: {id: number; externalPlayerId: number; marketValue: number; clauseValue: number;
        teamFantasyId?: number; acquiredAt?: Date}[];

    beforeEach(() => {
        manager = {};
        freeAgents = ELIGIBLE.map((player, index) => ({
            id: index + 1, externalPlayerId: player.externalPlayerId, marketValue: player.marketValue,
            clauseValue: player.marketValue
        }));

        repositories = {
            league: {
                create: jest.fn().mockImplementation((data) => Promise.resolve({id: 1, renamed: false, ...data})),
                existsByJoinCode: jest.fn().mockResolvedValue(false),
                findByJoinCodeForUpdate: jest.fn(),
                findById: jest.fn(),
                findByIdWithSettings: jest.fn(),
                save: jest.fn().mockImplementation((league) => Promise.resolve(league))
            },
            leagueCompetition: {createMany: jest.fn().mockResolvedValue(undefined)},
            leagueScoring: {create: jest.fn().mockResolvedValue({})},
            leagueBan: {existsByLeagueAndUser: jest.fn().mockResolvedValue(false)},
            team: {
                create: jest.fn().mockImplementation((data) => Promise.resolve({id: 50, totalPoints: 0, ...data})),
                findByUserAndLeague: jest.fn().mockResolvedValue(null),
                countByLeague: jest.fn().mockResolvedValue(3),
                findByUserWithLeagues: jest.fn(),
                countByLeagues: jest.fn(),
                findByLeague: jest.fn()
            },
            playerProperty: {
                insertMany: jest.fn().mockResolvedValue(undefined),
                findFreeAgents: jest.fn().mockImplementation(() => Promise.resolve(freeAgents)),
                saveMany: jest.fn().mockImplementation((players) => Promise.resolve(players))
            },
            user: {findByFirebaseUid: jest.fn().mockResolvedValue(USER)},
            ban: {findActiveByTargetUser: jest.fn().mockResolvedValue(null)},
            sportsData: {
                findCompetitionsByIds: jest.fn().mockResolvedValue([LALIGA, CHAMPIONS]),
                findCompetitions: jest.fn().mockResolvedValue([LALIGA, CHAMPIONS]),
                findEligiblePlayers: jest.fn().mockResolvedValue(ELIGIBLE),
                findPositionGroups: jest.fn().mockResolvedValue(
                    new Map(ELIGIBLE.map((player) => [player.externalPlayerId, player.positionGroup]))
                ),
                findPlayerCards: jest.fn().mockResolvedValue(new Map())
            }
        };
        // The draw itself is tested in squad-assignment.service.spec.ts: here it takes the first 14 candidates
        squadAssignment = {draw: jest.fn().mockImplementation((candidates: SquadCandidate[]) => candidates.slice(0, 14))};
        const dataSource = {transaction: jest.fn().mockImplementation((work: (m: object) => unknown) => work(manager))};
        const joinCodeService = {generateUnique: jest.fn().mockResolvedValue('ABC234')};

        service = new LeagueService(
            dataSource as never, repositories.league as never, repositories.leagueCompetition as never,
            repositories.leagueScoring as never, repositories.leagueBan as never, repositories.team as never,
            repositories.playerProperty as never, repositories.user as never, repositories.ban as never,
            repositories.sportsData as never, joinCodeService as never, squadAssignment as never
        );
    });

    describe('create', () => {
        it('creates the league with its settings, the free agents and the creator team with its squad', async () => {
            // Expected: trimmed name, owner = user, no multiplier settings, scoring and competitions saved, the 20
            // eligible players inserted as free agents and a 100M team named after the user with 14 players.
            const result = await service.create('uid-7', buildDto());

            expect(repositories.league.create).toHaveBeenCalledWith({
                name: 'Liga de amigos', joinCode: 'ABC234', ownerId: 7, pointReward: 200_000, captainEnabled: true,
                multipliersEnabled: false, multiplierFinalMatchdays: null, multiplierFactor: null, multiplierTarget: null
            }, manager);
            expect(repositories.leagueScoring.create).toHaveBeenCalledWith({leagueId: 1, ...SCORING}, manager);
            expect(repositories.leagueCompetition.createMany).toHaveBeenCalledWith(1, [LALIGA.id, CHAMPIONS.id], manager);
            expect(repositories.playerProperty.insertMany).toHaveBeenCalledWith(
                ELIGIBLE.map((player) => ({
                    leagueId: 1, externalPlayerId: player.externalPlayerId,
                    marketValue: player.marketValue, clauseValue: player.marketValue
                })), manager);
            expect(repositories.team.create).toHaveBeenCalledWith(
                {name: 'Ana', userId: 7, leagueId: 1, budget: 100_000_000}, manager);
            expect(result.league).toEqual({id: 1, name: 'Liga de amigos', joinCode: 'ABC234'});
            expect(result.team).toEqual({id: 50, name: 'Ana', budget: 100_000_000, totalPoints: 0});
            expect(result.squad).toHaveLength(14);
        });

        it('stores the multiplier settings when they are enabled', async () => {
            // Expected: final matchdays, factor and target are saved with the league.
            await service.create('uid-7', buildDto({
                multipliers: {enabled: true, finalMatchdays: 4, factor: 3, target: MultiplierTarget.BOTH}
            }));

            expect(repositories.league.create).toHaveBeenCalledWith(expect.objectContaining({
                multipliersEnabled: true, multiplierFinalMatchdays: 4, multiplierFactor: 3,
                multiplierTarget: MultiplierTarget.BOTH
            }), manager);
        });

        it('gives the squad players the initial clause and the acquisition date', async () => {
            // Expected: the 14 drawn players belong to the new team, with the initial squad clause and acquiredAt.
            const result = await service.create('uid-7', buildDto({teamName: 'Los Galácticos'}));

            const [[saved]] = repositories.playerProperty.saveMany.mock.calls as
                [[{teamFantasyId: number; clauseValue: number; marketValue: number; acquiredAt: Date}[]]];
            expect(saved).toHaveLength(14);
            for (const player of saved) {
                expect(player.teamFantasyId).toBe(50);
                expect(player.clauseValue).toBe(initialClause(player.marketValue));
                expect(player.acquiredAt).toBeInstanceOf(Date);
            }
            expect(result.team.name).toBe('Los Galácticos');
        });

        it('rejects unknown competitions without opening the transaction', async () => {
            // Expected: BadRequestException when MongoDB does not have one of the competitions; nothing is saved.
            repositories.sportsData.findCompetitionsByIds.mockResolvedValue([LALIGA]);

            await expect(service.create('uid-7', buildDto())).rejects.toThrow(BadRequestException);
            expect(repositories.league.create).not.toHaveBeenCalled();
        });

        it('rejects a user banned from the application', async () => {
            repositories.ban.findActiveByTargetUser.mockResolvedValue({id: 1});     //The user is banned and appears as row 1 at database

            await expect(service.create('uid-7', buildDto())).rejects.toThrow(ForbiddenException);
            expect(repositories.league.create).not.toHaveBeenCalled();
        });

        it('rejects a user without profile', async () => {
            // Expected: NotFoundException when there is no profile for the Firebase uid.
            repositories.user.findByFirebaseUid.mockResolvedValue(null);

            await expect(service.create('uid-7', buildDto())).rejects.toThrow(NotFoundException);
        });
    });

    describe('join', () => {
        const LEAGUE = {id: 3, name: 'Liga', joinCode: 'ABC234', ownerId: 1};

        beforeEach(() => {
            repositories.league.findByJoinCodeForUpdate.mockResolvedValue(LEAGUE);
        });

        it('creates the team with 100M and a squad drawn among the free agents', async () => {
            // Expected: the league is locked by its code (upper case), the team is created and gets 14 free agents.
            const result = await service.join('uid-7', {joinCode: 'abc234 ', teamName: 'Mi equipo'});

            expect(repositories.league.findByJoinCodeForUpdate).toHaveBeenCalledWith('ABC234', manager);
            expect(repositories.team.create).toHaveBeenCalledWith(
                {name: 'Mi equipo', userId: 7, leagueId: 3, budget: 100_000_000}, manager);
            expect(squadAssignment.draw).toHaveBeenCalledTimes(1);
            expect(result.squad).toHaveLength(14);
            expect(result.league).toEqual({id: 3, name: 'Liga', joinCode: 'ABC234'});
        });

        it('rejects an unknown code', async () => {
            // Expected: NotFoundException and no team created.
            repositories.league.findByJoinCodeForUpdate.mockResolvedValue(null);

            await expect(service.join('uid-7', {joinCode: 'ZZZZZZ'})).rejects.toThrow(NotFoundException);
            expect(repositories.team.create).not.toHaveBeenCalled();
        });

        it('rejects a user expelled from the league', async () => {
            // Expected: ForbiddenException, because an expelled user can never join that league again.
            repositories.leagueBan.existsByLeagueAndUser.mockResolvedValue(true);

            await expect(service.join('uid-7', {joinCode: 'ABC234'})).rejects.toThrow(ForbiddenException);
            expect(repositories.team.create).not.toHaveBeenCalled();
        });

        it('rejects a user who is already a member', async () => {
            // Expected: ConflictException and no second team.
            repositories.team.findByUserAndLeague.mockResolvedValue({id: 9});

            await expect(service.join('uid-7', {joinCode: 'ABC234'})).rejects.toThrow(ConflictException);
            expect(repositories.team.create).not.toHaveBeenCalled();
        });

        it('rejects joining a league with 8 teams', async () => {
            // Expected: ConflictException because the maximum of teams is 8.
            repositories.team.countByLeague.mockResolvedValue(8);

            await expect(service.join('uid-7', {joinCode: 'ABC234'})).rejects.toThrow(ConflictException);
            expect(repositories.team.create).not.toHaveBeenCalled();
        });

        it('rejects a user banned from the application before looking for the league', async () => {
            // Expected: ForbiddenException and the league is not even read.
            repositories.ban.findActiveByTargetUser.mockResolvedValue({id: 1});

            await expect(service.join('uid-7', {joinCode: 'ABC234'})).rejects.toThrow(ForbiddenException);
            expect(repositories.league.findByJoinCodeForUpdate).not.toHaveBeenCalled();
        });
    });

    describe('findMine', () => {
        it('lists the leagues of the user with their members and whether he owns them', async () => {
            // Expected: one summary per team, with the competition names, the number of members and isOwner.
            repositories.team.findByUserWithLeagues.mockResolvedValue([
                {id: 50, name: 'Ana FC', budget: 90 * M, totalPoints: 12, leagueId: 1,
                    league: {id: 1, name: 'Mía', ownerId: 7, competitions: [{competitionId: LALIGA.id}]}},
                {id: 51, name: 'Ana CF', budget: 100 * M, totalPoints: 0, leagueId: 2,
                    league: {id: 2, name: 'Ajena', ownerId: 9, competitions: [{competitionId: CHAMPIONS.id}]}}
            ]);
            repositories.team.countByLeagues.mockResolvedValue(new Map([[1, 4], [2, 8]]));

            const result = await service.findMine('uid-7');

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({id: 1, name: 'Mía', membersCount: 4, maxTeams: 8, isOwner: true});
            expect(result[0].competitions[0].name).toBe('La Liga');
            expect(result[1]).toMatchObject({id: 2, membersCount: 8, isOwner: false});
            expect(result[1].team).toEqual({id: 51, name: 'Ana CF', budget: 100 * M, totalPoints: 0});
        });
    });

    describe('findOne', () => {
        const LEAGUE = {
            id: 1, name: 'Liga', joinCode: 'ABC234', ownerId: 7, renamed: false, createdAt: new Date('2026-11-07'),
            pointReward: 100_000, captainEnabled: false, multipliersEnabled: true, multiplierFinalMatchdays: 3,
            multiplierFactor: 2, multiplierTarget: MultiplierTarget.RELEGATION,
            scoring: {leagueId: 1, ...SCORING}, competitions: [{competitionId: LALIGA.id}]
        };
        const TEAMS = [
            {id: 50, name: 'Ana FC', userId: 7, totalPoints: 30, user: {name: 'Ana'}},
            {id: 51, name: 'Luis FC', userId: 8, totalPoints: 10, user: {name: 'Luis'}}
        ];

        it('returns the whole league to a member', async () => {
            // Expected: settings, competitions and the ranking; the owner can still rename it.
            repositories.league.findByIdWithSettings.mockResolvedValue(LEAGUE);
            repositories.team.findByLeague.mockResolvedValue(TEAMS);

            const result = await service.findOne('uid-7', 1);

            expect(result).toMatchObject({
                id: 1, isOwner: true, canRename: true, initialBudget: 100_000_000, maxTeams: 8,
                multipliers: {enabled: true, finalMatchdays: 3, factor: 2, target: MultiplierTarget.RELEGATION}
            });
            expect(result.scoring).toEqual(SCORING);
            expect(result.competitions.map((competition) => competition.name)).toEqual(['La Liga']);
            expect(result.members.map((member) => member.teamName)).toEqual(['Ana FC', 'Luis FC']);
        });

        it('rejects a user who is not a member', async () => {
            // Expected: ForbiddenException, the league is only visible to its members.
            repositories.league.findByIdWithSettings.mockResolvedValue(LEAGUE);
            repositories.team.findByLeague.mockResolvedValue([TEAMS[1]]);

            await expect(service.findOne('uid-7', 1)).rejects.toThrow(ForbiddenException);
        });

        it('rejects an unknown league', async () => {
            // Expected: NotFoundException.
            repositories.league.findByIdWithSettings.mockResolvedValue(null);

            await expect(service.findOne('uid-7', 99)).rejects.toThrow(NotFoundException);
        });
    });

    describe('rename', () => {
        it('lets the owner rename the league once', async () => {
            // Expected: the trimmed name is saved and the league is marked as renamed.
            const league = {id: 1, name: 'Liga', ownerId: 7, renamed: false};
            repositories.league.findById.mockResolvedValue(league);
            const findOne = jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

            await service.rename('uid-7', 1, {name: '  Nueva liga '});

            expect(repositories.league.save).toHaveBeenCalledWith({id: 1, name: 'Nueva liga', ownerId: 7, renamed: true});
            expect(findOne).toHaveBeenCalledWith('uid-7', 1);
        });

        it('rejects a second rename', async () => {
            // Expected: ConflictException, the name can only be changed once.
            repositories.league.findById.mockResolvedValue({id: 1, ownerId: 7, renamed: true});

            await expect(service.rename('uid-7', 1, {name: 'Otra'})).rejects.toThrow(ConflictException);
            expect(repositories.league.save).not.toHaveBeenCalled();
        });

        it('rejects a member who is not the owner', async () => {
            // Expected: ForbiddenException, only the owner can rename the league.
            repositories.league.findById.mockResolvedValue({id: 1, ownerId: 9, renamed: false});

            await expect(service.rename('uid-7', 1, {name: 'Otra'})).rejects.toThrow(ForbiddenException);
            expect(repositories.league.save).not.toHaveBeenCalled();
        });
    });
});
