// System constants shared by every league

export const LEAGUE_MAX_TEAMS = 8;
export const LEAGUE_INITIAL_BUDGET = 100_000_000;

export const LEAGUE_NAME_MIN_LENGTH = 3;
export const LEAGUE_NAME_MAX_LENGTH = 30;
export const TEAM_NAME_MIN_LENGTH = 3;
export const TEAM_NAME_MAX_LENGTH = 30;

export const LEAGUE_MIN_COMPETITIONS = 1;
export const LEAGUE_MAX_COMPETITIONS = 3;

// Euros each fantasy point gives at the end of a matchday (chosen at creation)
export const POINT_REWARDS = [100_000, 200_000, 300_000];

// Final matchdays multipliers (chosen at creation)
export const MULTIPLIER_FINAL_MATCHDAYS = [3, 4, 5];
export const MULTIPLIER_FACTORS = [2, 3];

// Join code: 6 characters without ambiguous ones (0/O, 1/I/L), 31 symbols -> about 887 million codes
export const JOIN_CODE_LENGTH = 6;
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_MAX_ATTEMPTS = 10;

// Initial squad: 1 GK, 5 DEF, 4 MID and 4 FWD, with a total value inside the range
export const SQUAD_SHAPE = {GK: 1, DEF: 5, MID: 4, FWD: 4} as const;
export type PositionGroup = keyof typeof SQUAD_SHAPE;
export const POSITION_GROUPS = Object.keys(SQUAD_SHAPE) as PositionGroup[];
export const SQUAD_MIN_VALUE = 175_000_000;
export const SQUAD_MAX_VALUE = 225_000_000;
export const SQUAD_MAX_ATTEMPTS = 50;       //Attempts to make a squad between the value range

// Release clause of the initial squad players
export const CLAUSE_LOW_VALUE_LIMIT = 10_000_000;
export const CLAUSE_LOW_VALUE_MULTIPLIER = 1.5;
export const CLAUSE_HIGH_VALUE_MULTIPLIER = 1.25;
export const CLAUSE_MIN_HIGH_VALUE = 15_000_000;
