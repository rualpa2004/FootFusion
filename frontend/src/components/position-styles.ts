import type { PositionGroup } from "../config/league.constants";

/** Text and border of a player (card, photo on the pitch, option of the player picker). */
export const POSITION_COLORS: Record<PositionGroup, string> = {
    GK: 'text-warning border-warning',
    DEF: 'text-sky-400 border-sky-400',
    MID: 'text-primary border-primary',
    FWD: 'text-[#FF6B6B] border-[#FF6B6B]'
};

/** Colours of a player whose position is unknown. */
export const UNKNOWN_POSITION_COLORS = 'text-muted border-line-strong';

/** Position label (e.g. "DEF" in the squad table): the same colours over a translucent background. */
export const POSITION_PILL_COLORS: Record<PositionGroup, string> = {
    GK: 'bg-warning/15 text-warning',
    DEF: 'bg-sky-400/15 text-sky-400',
    MID: 'bg-primary-soft text-primary',
    FWD: 'bg-danger/15 text-[#FF6B6B]'
};
