// Rules of the lineup editor. Pure functions over a draft, so the page only keeps the draft in its state.
import type { PositionGroup } from "../config/league.constants";
import { DEFAULT_FORMATION, FORMATION_NAMES, FORMATIONS, LINEUP_SIZE, type Formation } from "../config/lineup.constants";
import type { Lineup, SaveLineupInput, TeamPlayer } from "../services/team.service";

export interface LineupDraft {
    formation: Formation;
    slots: Record<string, number | null>;   //If empty then null
    captainId: number | null;
}

export type PositionCounts = Record<PositionGroup, number>;

const POSITIONS: readonly PositionGroup[] = ['GK', 'DEF', 'MID', 'FWD'];

export function isFormation(value: string): value is Formation {
    return (FORMATION_NAMES as string[]).includes(value);
}

/** Players of each position in a formation. */
export function formationShape(formation: Formation): PositionCounts {
    return {GK: 1, ...FORMATIONS[formation]};
}

/** Slots of one position in a formation: 'DEF1'...'DEF4'. */
export function positionSlots(formation: Formation, position: PositionGroup): string[] {
    return Array.from({length: formationShape(formation)[position]}, (_, index) => `${position}${index + 1}`);
}

/** Position a slot is for ('DEF3' -> 'DEF'). */
export function slotPosition(slot: string): PositionGroup {
    return slot.replace(/\d/g, '') as PositionGroup;
}

export function emptyDraft(formation: Formation): LineupDraft {
    const slots: Record<string, number | null> = {};
    for (const position of POSITIONS) {
        for (const slot of positionSlots(formation, position)) {
            slots[slot] = null;
        }
    }
    return {formation, slots, captainId: null};
}

/** Draft of a lineup received from the backend. Slots of another formation (never expected) are ignored. */
export function draftFromLineup(lineup: Lineup): LineupDraft {
    const draft = emptyDraft(isFormation(lineup.formation) ? lineup.formation : DEFAULT_FORMATION);
    for (const {slot, playerPropertyId} of lineup.players) {
        if (slot in draft.slots) {
            draft.slots[slot] = playerPropertyId;
        }
    }
    return {...draft, captainId: lineup.captainId};
}

export function starterIds(draft: LineupDraft): Set<number> {
    return new Set(Object.values(draft.slots).filter((id): id is number => id !== null));
}

export function startersCount(draft: LineupDraft): number {
    return starterIds(draft).size;
}

export function isComplete(draft: LineupDraft): boolean {
    return startersCount(draft) === LINEUP_SIZE;
}

/** Players of each position in the squad. */
export function squadCounts(squad: TeamPlayer[]): PositionCounts {
    const counts: PositionCounts = {GK: 0, DEF: 0, MID: 0, FWD: 0};
    for (const player of squad) {
        if (player.positionGroup) {
            counts[player.positionGroup]++;
        }
    }
    return counts;
}

/** Whether the squad can fill every slot of the formation. */
export function canCover(formation: Formation, counts: PositionCounts): boolean {
    const shape = formationShape(formation);
    return POSITIONS.every((position) => counts[position] >= shape[position]);
}

export function changeFormation(draft: LineupDraft, formation: Formation): LineupDraft {
    const next = emptyDraft(formation);
    for (const position of POSITIONS) {
        const players = positionSlots(draft.formation, position)
            .map((slot) => draft.slots[slot])
            .filter((id): id is number => id !== null);
        positionSlots(formation, position).forEach((slot, index) => {
            next.slots[slot] = players[index] ?? null;
        });
    }
    return withValidCaptain({...next, captainId: draft.captainId});
}

export function assignPlayer(draft: LineupDraft, slot: string, playerId: number): LineupDraft {
    const slots = {...draft.slots};
    const previousSlot = Object.keys(slots).find((key) => slots[key] === playerId);
    if (previousSlot) {
        slots[previousSlot] = slots[slot];
    }
    slots[slot] = playerId;
    return withValidCaptain({...draft, slots});
}

/** Sends the player of a slot to the bench. */
export function clearSlot(draft: LineupDraft, slot: string): LineupDraft {
    return withValidCaptain({...draft, slots: {...draft.slots, [slot]: null}});
}

/** Makes a starter the captain, or removes the captaincy when he already has it. */
export function toggleCaptain(draft: LineupDraft, playerId: number): LineupDraft {
    return {...draft, captainId: draft.captainId === playerId ? null : playerId};
}

/** The captain has to be a starter: a captain sent to the bench loses the captaincy. */
function withValidCaptain(draft: LineupDraft): LineupDraft {
    return draft.captainId !== null && !starterIds(draft).has(draft.captainId) ? {...draft, captainId: null} : draft;
}

/** First empty slot of a position, or null when the line is full. */
export function firstEmptySlot(draft: LineupDraft, position: PositionGroup): string | null {
    return positionSlots(draft.formation, position).find((slot) => draft.slots[slot] === null) ?? null;
}

export function toSaveInput(draft: LineupDraft): SaveLineupInput {
    const players = Object.entries(draft.slots)
        .filter((entry): entry is [string, number] => entry[1] !== null)
        .map(([slot, playerPropertyId]) => ({slot, playerPropertyId}));
    return {formation: draft.formation, players, captainId: draft.captainId};
}

/** True when both drafts would save the same lineup. */
export function sameDraft(a: LineupDraft, b: LineupDraft): boolean {
    return JSON.stringify(toSaveInput(a)) === JSON.stringify(toSaveInput(b));
}
