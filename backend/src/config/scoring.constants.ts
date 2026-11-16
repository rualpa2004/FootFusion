// Allowed values of the scoring settings that the league creator chooses (immutable after creation)
// Negative values are penalties. The fixed actions (shots on target, key passes, saves and dribbles) are not configurable.

export const SCORING_OPTIONS = {
    minutesMaxPoints: [1, 2, 3],            // 3: >30', >60' and 90'+ score; 2: >60' and 90'+; 1: only 90'+
    forwardGoalPoints: [3, 4, 5],           // MID +1, DEF +2 and GK +4 over this value
    assistPoints: [2, 3, 4],
    defenderCleanSheetPoints: [3, 4, 5],    // GK +1; MID and FWD always 1
    goalsConcededPenalty: [-1, -2],         // Per goal for GK and DEF, per 2 goals for MID and FWD
    yellowCardPenalty: [-1, -2],
    redCardPenalty: [-2, -4],
    missedPenaltyPenalty: [-1, -2],
    ownGoalPenalty: [-1, -2, -3],
    duelsWonPoints: [1, 2],                 // Every 5 duels won
    foulsCommittedPenalty: [-1, -2]         // Every 3 fouls committed
} as const;

export type ScoringSetting = keyof typeof SCORING_OPTIONS;
export type ScoringSettings = Record<ScoringSetting, number>;
