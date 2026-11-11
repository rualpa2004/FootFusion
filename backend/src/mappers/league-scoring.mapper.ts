import { LeagueScoring } from "../entities/league-scoring.entity";
import { LeagueScoringDTO } from "../dtos/league/league-scoring.dto";
import { SCORING_OPTIONS, ScoringSetting, ScoringSettings } from "../config/scoring.constants";

const SCORING_KEYS = Object.keys(SCORING_OPTIONS) as ScoringSetting[];

function pickSettings(source: ScoringSettings): ScoringSettings {
    return Object.fromEntries(SCORING_KEYS.map((key) => [key, source[key]])) as ScoringSettings;
}

export class LeagueScoringMapper {

    static toDTO(scoring: LeagueScoring | null | undefined): ScoringSettings | null {
        return scoring ? pickSettings(scoring) : null;
    }

    static toEntity(dto: LeagueScoringDTO, leagueId: number): Partial<LeagueScoring> {
        return {leagueId, ...pickSettings(dto)};
    }
}
