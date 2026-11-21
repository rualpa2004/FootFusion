import { DEFAULT_FORMATION, Formation, FORMATIONS, PositionGroup } from "../config/league.constants";
import { LineupData } from "../repositories/lineup.repository";

// Squad player with the position needed to place him in the lineup
export interface LineupCandidate {
    id: number;                     // PlayerProperty id
    positionGroup: PositionGroup;
}

// Number of players of each position in a formation
export function formationShape(formation: Formation): Record<PositionGroup, number> {
    return {GK: 1, ...FORMATIONS[formation]};
}

// Slots of a formation: 'GK1', 'DEF1'...'DEF4', 'MID1'... in this order
export function formationSlots(formation: Formation): string[] {
    return Object.entries(formationShape(formation)).flatMap(([group, count]) =>
        Array.from({length: count}, (_, index) => `${group}${index + 1}`)
    );
}

// Position a slot is for ('DEF3' -> 'DEF')
export function slotGroup(slot: string): PositionGroup {
    return slot.replace(/\d+$/, '') as PositionGroup;
}

// Lineup created with the initial squad: the default formation filled with the squad players in the given order. The
// slots the squad can not fill stay empty.
export function buildDefaultLineup(squad: LineupCandidate[]): LineupData {
    const shape = formationShape(DEFAULT_FORMATION);
    const used: Record<string, number> = {};
    const players: LineupData['players'] = [];

    for (const player of squad) {
        const taken = used[player.positionGroup] ?? 0;
        if (taken < shape[player.positionGroup]) {
            used[player.positionGroup] = taken + 1;
            players.push({slot: `${player.positionGroup}${taken + 1}`, playerPropertyId: player.id});
        }
    }
    return {formation: DEFAULT_FORMATION, captainId: null, players};
}

// Problem of a lineup sent by the user, or null when it is valid. Empty slots are allowed (an incomplete lineup does not
// score, but it can be saved). positions: position of every player of the user's squad, by PlayerProperty id.
export function lineupError(lineup: LineupData, positions: Map<number, PositionGroup>, captainEnabled: boolean): string | null {
    const slots = new Set(formationSlots(lineup.formation as Formation));
    const usedSlots = new Set<string>();
    const usedPlayers = new Set<number>();

    for (const {slot, playerPropertyId} of lineup.players) {
        if (!slots.has(slot)) return `Slot ${slot} does not exist in the formation ${lineup.formation}`;
        if (usedSlots.has(slot)) return `Slot ${slot} is used twice`;
        if (usedPlayers.has(playerPropertyId)) return `Player ${playerPropertyId} is used twice`;

        const position = positions.get(playerPropertyId);
        if (!position) return `Player ${playerPropertyId} is not in the squad`;
        if (position !== slotGroup(slot)) return `Player ${playerPropertyId} can not play as ${slotGroup(slot)}`;

        usedSlots.add(slot);
        usedPlayers.add(playerPropertyId);
    }

    if (lineup.captainId != null) {
        if (!captainEnabled) return 'The league has no captain';
        if (!usedPlayers.has(lineup.captainId)) return 'The captain must be a starter';
    }
    return null;
}
