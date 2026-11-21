import { buildDefaultLineup, formationSlots, lineupError, slotGroup } from "../../../src/services/lineup-rules";
import { PositionGroup } from "../../../src/config/league.constants";

// Squad of the example: 1 GK (1), 5 DEF (2-6), 4 MID (7-10) and 4 FWD (11-14)
const POSITIONS = new Map<number, PositionGroup>([
    [1, 'GK'], [2, 'DEF'], [3, 'DEF'], [4, 'DEF'], [5, 'DEF'], [6, 'DEF'],
    [7, 'MID'], [8, 'MID'], [9, 'MID'], [10, 'MID'], [11, 'FWD'], [12, 'FWD'], [13, 'FWD'], [14, 'FWD']
]);
const SQUAD = [...POSITIONS.entries()].map(([id, positionGroup]) => ({id, positionGroup}));

// A valid 4-3-3 with every slot filled
const FULL_433 = {
    formation: '4-3-3', captainId: null,
    players: [
        {slot: 'GK1', playerPropertyId: 1}, {slot: 'DEF1', playerPropertyId: 2}, {slot: 'DEF2', playerPropertyId: 3},
        {slot: 'DEF3', playerPropertyId: 4}, {slot: 'DEF4', playerPropertyId: 5}, {slot: 'MID1', playerPropertyId: 7},
        {slot: 'MID2', playerPropertyId: 8}, {slot: 'MID3', playerPropertyId: 9}, {slot: 'FWD1', playerPropertyId: 11},
        {slot: 'FWD2', playerPropertyId: 12}, {slot: 'FWD3', playerPropertyId: 13}
    ]
};

describe('formationSlots and slotGroup', () => {
    it('lists the 11 slots of a formation from the goalkeeper to the forwards', () => {
        // Expected: GK1, DEF1-DEF5, MID1-MID3 and FWD1-FWD2 for a 5-3-2.
        expect(formationSlots('5-3-2')).toEqual([
            'GK1', 'DEF1', 'DEF2', 'DEF3', 'DEF4', 'DEF5', 'MID1', 'MID2', 'MID3', 'FWD1', 'FWD2'
        ]);
    });

    it('reads the position of a slot', () => {
        // Expected: 'DEF3' is a defender slot.
        expect(slotGroup('DEF3')).toBe('DEF');
    });
});

describe('buildDefaultLineup', () => {
    it('fills a 4-4-2 with the squad in order and no captain', () => {
        // Expected: the goalkeeper, the first 4 defenders, the 4 midfielders and the first 2 forwards.
        expect(buildDefaultLineup(SQUAD)).toEqual({
            formation: '4-4-2', captainId: null,
            players: [
                {slot: 'GK1', playerPropertyId: 1}, {slot: 'DEF1', playerPropertyId: 2}, {slot: 'DEF2', playerPropertyId: 3},
                {slot: 'DEF3', playerPropertyId: 4}, {slot: 'DEF4', playerPropertyId: 5}, {slot: 'MID1', playerPropertyId: 7},
                {slot: 'MID2', playerPropertyId: 8}, {slot: 'MID3', playerPropertyId: 9}, {slot: 'MID4', playerPropertyId: 10},
                {slot: 'FWD1', playerPropertyId: 11}, {slot: 'FWD2', playerPropertyId: 12}
            ]
        });
    });

    it('leaves empty the slots the squad can not fill', () => {
        // Expected: a squad without goalkeeper gets no GK1 slot.
        const lineup = buildDefaultLineup(SQUAD.filter((player) => player.positionGroup !== 'GK'));
        expect(lineup.players.some((player) => player.slot === 'GK1')).toBe(false);
        expect(lineup.players).toHaveLength(10);
    });
});

describe('lineupError', () => {
    it('accepts a complete lineup with a starter as captain', () => {
        // Expected: null (valid).
        expect(lineupError({...FULL_433, captainId: 11}, POSITIONS, true)).toBeNull();
    });

    it('accepts an incomplete lineup', () => {
        // Expected: null, because empty slots are allowed (a 3-5-2 with only 4 midfielders).
        const lineup = {formation: '3-5-2', captainId: null, players: [
            {slot: 'GK1', playerPropertyId: 1}, {slot: 'MID1', playerPropertyId: 7}, {slot: 'MID2', playerPropertyId: 8},
            {slot: 'MID3', playerPropertyId: 9}, {slot: 'MID4', playerPropertyId: 10}
        ]};
        expect(lineupError(lineup, POSITIONS, true)).toBeNull();
    });

    it.each([
        ['a slot outside the formation', {...FULL_433, players: [{slot: 'DEF5', playerPropertyId: 6}]}, 'does not exist'],
        ['the same slot twice', {...FULL_433, players: [
            {slot: 'DEF1', playerPropertyId: 2}, {slot: 'DEF1', playerPropertyId: 3}]}, 'used twice'],
        ['the same player twice', {...FULL_433, players: [
            {slot: 'DEF1', playerPropertyId: 2}, {slot: 'DEF2', playerPropertyId: 2}]}, 'used twice'],
        ['a player of another squad', {...FULL_433, players: [{slot: 'DEF1', playerPropertyId: 99}]}, 'not in the squad'],
        ['a player in a slot of another position', {...FULL_433, players: [{slot: 'DEF1', playerPropertyId: 11}]}, 'can not play'],
        ['a captain on the bench', {...FULL_433, captainId: 14}, 'must be a starter']
    ])('rejects %s', (_case, lineup, message) => {
        // Expected: an error message explaining the problem.
        expect(lineupError(lineup, POSITIONS, true)).toContain(message);
    });

    it('rejects a captain in a league without captain', () => {
        // Expected: the league setting forbids choosing one.
        expect(lineupError({...FULL_433, captainId: 11}, POSITIONS, false)).toBe('The league has no captain');
    });
});
