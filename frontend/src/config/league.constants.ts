// League rules shared with the backend (league.constants and scoring.constants).
// The frontend repeats them to validate the forms and to build the options; the backend validates them again.

export const LEAGUE_MAX_TEAMS = 8;
export const LEAGUE_INITIAL_BUDGET = 100_000_000;
export const SQUAD_SIZE = 14;

export const LEAGUE_NAME_MIN_LENGTH = 3;
export const LEAGUE_NAME_MAX_LENGTH = 30;
export const TEAM_NAME_MIN_LENGTH = 3;
export const TEAM_NAME_MAX_LENGTH = 30;

export const LEAGUE_MIN_COMPETITIONS = 1;
export const LEAGUE_MAX_COMPETITIONS = 3;

export const JOIN_CODE_LENGTH = 6;
export const JOIN_CODE_PATTERN = /^[A-Z0-9]{6}$/;

// Euros each fantasy point gives at the end of a matchday. Default: the minimum.
export const POINT_REWARDS = [100_000, 200_000, 300_000] as const;
export const DEFAULT_POINT_REWARD = POINT_REWARDS[0];

export type MultiplierTarget = 'RELEGATION' | 'CHAMPIONS' | 'BOTH';

export const MULTIPLIER_FINAL_MATCHDAYS = [3, 4, 5] as const;
export const MULTIPLIER_FACTORS = [2, 3] as const;
export const MULTIPLIER_TARGETS: readonly MultiplierTarget[] = ['RELEGATION', 'CHAMPIONS', 'BOTH'];
export const MULTIPLIER_TARGET_LABELS: Record<MultiplierTarget, string> = {
    RELEGATION: 'Descenso',
    CHAMPIONS: 'Champions',
    BOTH: 'Ambos'
};

// Values the multipliers start with when the creator enables them
export const DEFAULT_MULTIPLIERS = {
    finalMatchdays: MULTIPLIER_FINAL_MATCHDAYS[0],
    factor: MULTIPLIER_FACTORS[0],
    target: MULTIPLIER_TARGETS[0]
};

export const SCORING_OPTIONS = {
    minutesMaxPoints: [1, 2, 3],
    forwardGoalPoints: [3, 4, 5],
    assistPoints: [2, 3, 4],
    defenderCleanSheetPoints: [3, 4, 5],
    goalsConcededPenalty: [-1, -2],
    yellowCardPenalty: [-1, -2],
    redCardPenalty: [-2, -4],
    missedPenaltyPenalty: [-1, -2],
    ownGoalPenalty: [-1, -2, -3],
    duelsWonPoints: [1, 2],
    foulsCommittedPenalty: [-1, -2]
} as const;

export type ScoringSetting = keyof typeof SCORING_OPTIONS;
export type ScoringSettings = Record<ScoringSetting, number>;

export const SCORING_SETTINGS = Object.keys(SCORING_OPTIONS) as ScoringSetting[];

export const STANDARD_SCORING: ScoringSettings = {
    minutesMaxPoints: 2,
    forwardGoalPoints: 4,
    assistPoints: 3,
    defenderCleanSheetPoints: 4,
    goalsConcededPenalty: -1,
    yellowCardPenalty: -1,
    redCardPenalty: -2,
    missedPenaltyPenalty: -1,
    ownGoalPenalty: -2,
    duelsWonPoints: 1,
    foulsCommittedPenalty: -1
};

export const SCORING_LABELS: Record<ScoringSetting, {label: string; hint?: string}> = {
    minutesMaxPoints: {label: 'Minutos jugados', hint: 'Con 3 puntúan más de 30\', más de 60\' y 90\'; con 2, más de 60\' y 90\'; con 1, solo 90\'.'},
    forwardGoalPoints: {label: 'Gol (delantero)', hint: 'Centrocampista +1, defensa +2 y portero +4 sobre este valor.'},
    assistPoints: {label: 'Asistencia'},
    defenderCleanSheetPoints: {label: 'Portería a cero (defensa)', hint: 'Portero +1. Centrocampistas y delanteros siempre 1.'},
    goalsConcededPenalty: {label: 'Goles encajados', hint: 'Por gol en porteros y defensas; cada 2 goles en el resto.'},
    yellowCardPenalty: {label: 'Tarjeta amarilla'},
    redCardPenalty: {label: 'Tarjeta roja'},
    missedPenaltyPenalty: {label: 'Penalti fallado'},
    ownGoalPenalty: {label: 'Gol en propia puerta'},
    duelsWonPoints: {label: 'Duelos ganados (cada 5)'},
    foulsCommittedPenalty: {label: 'Faltas cometidas (cada 3)'}
};

export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

// Order in which the squad is shown on the pitch (forwards on top) and revealed (goalkeeper first)
export const PITCH_ROWS: readonly PositionGroup[] = ['FWD', 'MID', 'DEF', 'GK'];
