import { Injectable } from "@nestjs/common";
import { SportsDataRepository } from "../repositories/sports-data.repository";
import { CompetitionResponseDTO } from "../dtos/competition/competition-response.dto";

@Injectable()
export class CompetitionService {
    constructor(private readonly sportsDataRepository: SportsDataRepository) {}

    // Competitions a league can be made of (shown in the create league form)
    async findAll(): Promise<CompetitionResponseDTO[]> {
        const competitions = await this.sportsDataRepository.findCompetitions();
        return competitions.map((competition) => new CompetitionResponseDTO(competition));
    }
}
