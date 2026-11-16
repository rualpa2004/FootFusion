import { TeamFantasy } from "../entities/team-fantasy.entity";
import { User } from "../entities/user.entity";
import { LEAGUE_INITIAL_BUDGET } from "../config/league.constants";

export class TeamFantasyMapper {

    // Team of a new member: the user's name when no team name is given, and the initial budget of every league
    static toEntity(user: User, leagueId: number, teamName?: string): Partial<TeamFantasy> {
        return {
            name: teamName?.trim() || user.name,
            userId: user.id,
            leagueId,
            budget: LEAGUE_INITIAL_BUDGET
        };
    }
}
