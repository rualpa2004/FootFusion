import { LeagueCompetition } from "../entities/league-competition.entity";
import { CompetitionResponseDTO } from "../dtos/competition/competition-response.dto";
import { CompetitionData } from "../repositories/sports-data.repository";

export class LeagueCompetitionMapper {

    // If the competition is missing in MongoDB, the id is kept with an empty name.
    static toDTO(leagueCompetition: LeagueCompetition, competitionsById: Map<number, CompetitionData>): CompetitionResponseDTO {
        const competitionId = leagueCompetition.competitionId;
        return new CompetitionResponseDTO(competitionsById.get(competitionId) ?? {id: competitionId, name: ''});
    }

    static toDTOs(leagueCompetitions: LeagueCompetition[] | undefined, competitionsById: Map<number, CompetitionData>): CompetitionResponseDTO[] {
        return (leagueCompetitions ?? []).map((leagueCompetition) =>
            LeagueCompetitionMapper.toDTO(leagueCompetition, competitionsById)
        );
    }
}
