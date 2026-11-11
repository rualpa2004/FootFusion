import { League } from "../entities/league.entity";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { CreateLeagueDTO } from "../dtos/league/create-league.dto";
import { LeagueSummaryDTO } from "../dtos/league/league-response.dto";
import { CompetitionData } from "../repositories/sports-data.repository";
import { LeagueCompetitionMapper } from "./league-competition.mapper";

export class LeagueMapper {

    // League row of a new league. The multiplier columns are null when the multipliers are disabled.
    static toEntity(dto: CreateLeagueDTO, joinCode: string, ownerId: number): Partial<League> {
        const multipliers = dto.multipliers.enabled ? dto.multipliers : null;
        return {
            name: dto.name.trim(),
            joinCode,
            ownerId,
            pointReward: dto.pointReward,
            captainEnabled: dto.captainEnabled,
            multipliersEnabled: multipliers !== null,
            multiplierFinalMatchdays: multipliers?.finalMatchdays ?? null,
            multiplierFactor: multipliers?.factor ?? null,
            multiplierTarget: multipliers?.target ?? null
        };
    }

    // team: the user's team, loaded with its league and the league's competitions
    static toSummaryDTO(team: TeamFantasy, membersCount: number, competitionsById: Map<number, CompetitionData>, userId: number): LeagueSummaryDTO {
        const competitions = LeagueCompetitionMapper.toDTOs(team.league.competitions, competitionsById);
        return new LeagueSummaryDTO(team, membersCount, competitions, userId);
    }

    // counts: number of teams of each league ({leagueId: count})
    static toSummaryDTOs(teams: TeamFantasy[], counts: Map<number, number>, competitionsById: Map<number, CompetitionData>, userId: number): LeagueSummaryDTO[] {
        return teams.map((team) => LeagueMapper.toSummaryDTO(
            team, counts.get(team.leagueId) ?? 0, competitionsById, userId
        ));
    }
}
