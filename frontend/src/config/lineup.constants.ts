// Lineup rules shared with the backend (league.constants). The frontend repeats them to build the formation selector and
// the pitch; the backend validates every saved lineup again.
import type { PositionGroup } from "./league.constants";

export const SQUAD_MAX_PLAYERS = 23;
export const LINEUP_SIZE = 11;

/** Outfield players of each formation: defenders, midfielders and forwards (the goalkeeper is always 1). */
export const FORMATIONS = {
    '3-4-3': {DEF: 3, MID: 4, FWD: 3},
    '3-5-2': {DEF: 3, MID: 5, FWD: 2},
    '4-2-4': {DEF: 4, MID: 2, FWD: 4},
    '4-3-3': {DEF: 4, MID: 3, FWD: 3},
    '4-4-2': {DEF: 4, MID: 4, FWD: 2},
    '4-5-1': {DEF: 4, MID: 5, FWD: 1},
    '5-2-3': {DEF: 5, MID: 2, FWD: 3},
    '5-3-2': {DEF: 5, MID: 3, FWD: 2},
    '5-4-1': {DEF: 5, MID: 4, FWD: 1}
} as const satisfies Record<string, Record<Exclude<PositionGroup, 'GK'>, number>>;

export type Formation = keyof typeof FORMATIONS;

export const FORMATION_NAMES = Object.keys(FORMATIONS) as Formation[];
export const DEFAULT_FORMATION: Formation = '4-4-2';
