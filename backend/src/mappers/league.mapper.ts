import { League } from "../entities/league.entity";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { CreateLeagueDTO } from "../dtos/league/create-league.dto";
import { LeagueSummaryDTO } from "../dtos/league/league-response.dto";
import { CompetitionData } from "../repositories/sports-data.repository";
import { LeagueCompetitionMapper } from "./league-competition.mapper";

export class LeagueMapper {

    // League row of a new league. The multiplier columns are null when the multipliers are disabled.
    static toEntity(dto: CreateLeagueDTO, joinCode: string, ownerId: number, firstMatchday: number | null = null): Partial<League> {
        const multipliers = dto.multipliers.enabled ? dto.multipliers : null;
        return {
            name: dto.name.trim(),
            joinCode,
            ownerId,
            firstMatchday,
            pointReward: dto.pointReward,
            captainEnabled: dto.captainEnabled,
            multipliersEnabled: multipliers !== null,
            multiplierFinalMatchdays: multipliers?.finalMatchdays ?? null,
            multiplierFactor: multipliers?.factor ?? null,
            multiplierTarget: multipliers?.target ?? null
        };
    }

    // team: the user's team, loaded with its league and the league's competitions
    // ranking: team ids of the team's league in ranking order
    static toSummaryDTO(team: TeamFantasy, ranking: number[], competitionsById: Map<number, CompetitionData>, userId: number): LeagueSummaryDTO {
        const competitions = LeagueCompetitionMapper.toDTOs(team.league.competitions, competitionsById);
        return new LeagueSummaryDTO(team, ranking, competitions, userId);
    }

    // rankings: team ids of each league in ranking order ({leagueId: [teamIds]})
    static toSummaryDTOs(teams: TeamFantasy[], rankings: Map<number, number[]>, competitionsById: Map<number, CompetitionData>, userId: number): LeagueSummaryDTO[] {
        return teams.map((team) => LeagueMapper.toSummaryDTO(
            team, rankings.get(team.leagueId) ?? [team.id], competitionsById, userId
        ));
    }
}
