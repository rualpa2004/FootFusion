import { CompetitionData } from "../../repositories/sports-data.repository";

export class CompetitionResponseDTO {
    id: number;
    name: string;
    logo?: string;
    countryName?: string;

    constructor(competition: CompetitionData) {
        this.id = competition.id;
        this.name = competition.name;
        this.logo = competition.logo;
        this.countryName = competition.countryName;
    }
}
