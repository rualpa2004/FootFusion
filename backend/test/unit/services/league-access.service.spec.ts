import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { LeagueAccessService } from "../../../src/services/league-access.service";

jest.mock('../../../src/repositories/user.repository', () => ({UserRepository: class UserRepository {}}));
jest.mock('../../../src/repositories/league.repository', () => ({LeagueRepository: class LeagueRepository {}}));
jest.mock('../../../src/repositories/team-fantasy.repository', () => ({
    TeamFantasyRepository: class TeamFantasyRepository {}
}));

const USER = {id: 7};
const LEAGUE = {id: 3};
const TEAMS = [{id: 60, userId: 8}, {id: 50, userId: 7}];

describe('LeagueAccessService', () => {
    let service: LeagueAccessService;
    let users: {findByFirebaseUid: jest.Mock};
    let leagues: {findByIdWithSettings: jest.Mock};
    let teams: {findByLeague: jest.Mock};

    beforeEach(() => {
        users = {findByFirebaseUid: jest.fn().mockResolvedValue(USER)};
        leagues = {findByIdWithSettings: jest.fn().mockResolvedValue(LEAGUE)};
        teams = {findByLeague: jest.fn().mockResolvedValue(TEAMS)};
        service = new LeagueAccessService(users as never, leagues as never, teams as never);
    });

    it('returns the user, the league, the user\'s team and the ranking', async () => {
        // Expected: myTeam is team 50 (user 7) and teams is the whole ranking.
        const membership = await service.findMembership('uid-7', 3);

        expect(membership).toEqual({user: USER, league: LEAGUE, myTeam: TEAMS[1], teams: TEAMS});
    });

    it('rejects an unknown user or league', async () => {
        // Expected: NotFoundException in both cases.
        users.findByFirebaseUid.mockResolvedValueOnce(null);
        await expect(service.findMembership('uid-x', 3)).rejects.toThrow(NotFoundException);

        leagues.findByIdWithSettings.mockResolvedValueOnce(null);
        await expect(service.findMembership('uid-7', 99)).rejects.toThrow(NotFoundException);
    });

    it('rejects a user who is not a member', async () => {
        // Expected: ForbiddenException when no team of the league belongs to the user.
        users.findByFirebaseUid.mockResolvedValue({id: 9});

        await expect(service.findMembership('uid-9', 3)).rejects.toThrow(ForbiddenException);
    });

    it('finds a team of the league and rejects a team of another league', async () => {
        // Expected: team 60 is found; team 99 is not in the league (NotFoundException).
        const membership = await service.findMembership('uid-7', 3);

        expect(service.findTeam(membership, 60)).toBe(TEAMS[0]);
        expect(() => service.findTeam(membership, 99)).toThrow(NotFoundException);
    });
});
