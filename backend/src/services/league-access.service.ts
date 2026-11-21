import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { League } from "../entities/league.entity";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { User } from "../entities/user.entity";
import { LeagueRepository } from "../repositories/league.repository";
import { TeamFantasyRepository } from "../repositories/team-fantasy.repository";
import { UserRepository } from "../repositories/user.repository";

// The user, the league and the user's team in it. teams: the league ranking (ordered by points, with their users).
export interface Membership {
    user: User;
    league: League;
    myTeam: TeamFantasy;
    teams: TeamFantasy[];
}

// Checks that the user is a member of the league before reading or changing anything inside it
@Injectable()
export class LeagueAccessService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly leagueRepository: LeagueRepository,
        private readonly teamFantasyRepository: TeamFantasyRepository
    ) {}

    async findMembership(firebaseUid: string, leagueId: number): Promise<Membership> {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        const league = await this.leagueRepository.findByIdWithSettings(leagueId);
        if (!league) {
            throw new NotFoundException("League not found");
        }
        const teams = await this.teamFantasyRepository.findByLeague(league.id);
        const myTeam = teams.find((team) => team.userId === user.id);
        if (!myTeam) {
            throw new ForbiddenException("The user is not a member of this league");
        }
        return {user, league, myTeam, teams};
    }

    // A team of the league (any member can see the others)
    findTeam(membership: Membership, teamId: number): TeamFantasy {
        const team = membership.teams.find((item) => item.id === teamId);
        if (!team) {
            throw new NotFoundException("Team not found in this league");
        }
        return team;
    }
}
