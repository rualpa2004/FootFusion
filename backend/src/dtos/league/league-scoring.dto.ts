import { IsIn } from "class-validator";
import { SCORING_OPTIONS } from "../../config/scoring.constants";

// Scoring settings chosen when the league is created (allowed values in config/scoring.constants.ts)
export class LeagueScoringDTO {

    @IsIn(SCORING_OPTIONS.minutesMaxPoints)
    minutesMaxPoints: number;

    @IsIn(SCORING_OPTIONS.forwardGoalPoints)
    forwardGoalPoints: number;

    @IsIn(SCORING_OPTIONS.assistPoints)
    assistPoints: number;

    @IsIn(SCORING_OPTIONS.defenderCleanSheetPoints)
    defenderCleanSheetPoints: number;

    @IsIn(SCORING_OPTIONS.goalsConcededPenalty)
    goalsConcededPenalty: number;

    @IsIn(SCORING_OPTIONS.yellowCardPenalty)
    yellowCardPenalty: number;

    @IsIn(SCORING_OPTIONS.redCardPenalty)
    redCardPenalty: number;

    @IsIn(SCORING_OPTIONS.missedPenaltyPenalty)
    missedPenaltyPenalty: number;

    @IsIn(SCORING_OPTIONS.ownGoalPenalty)
    ownGoalPenalty: number;

    @IsIn(SCORING_OPTIONS.duelsWonPoints)
    duelsWonPoints: number;

    @IsIn(SCORING_OPTIONS.foulsCommittedPenalty)
    foulsCommittedPenalty: number;
}
