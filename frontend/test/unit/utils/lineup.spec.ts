import { describe, expect, it } from 'vitest';
import {
    assignPlayer,
    canCover,
    changeFormation,
    clearSlot,
    draftFromLineup,
    emptyDraft,
    firstEmptySlot,
    isComplete,
    sameDraft,
    squadCounts,
    startersCount,
    toggleCaptain,
    toSaveInput
} from '../../../src/utils/lineup';
import { buildTeamSquad, MY_LINEUP } from '../../helpers/team-fixtures';

describe('draftFromLineup', () => {
    it('places every starter in his slot and keeps the captain', () => {
        // Expected: 11 starters, complete, MID2 = 8 and captain 11.
        const draft = draftFromLineup(MY_LINEUP);

        expect(startersCount(draft)).toBe(11);
        expect(isComplete(draft)).toBe(true);
        expect(draft.slots.MID2).toBe(8);
        expect(draft.captainId).toBe(11);
    });

    it('uses the default 4-4-2 with empty slots for an unknown formation', () => {
        // Expected: formation 4-4-2 and only the starters whose slot exists in it.
        const draft = draftFromLineup({...MY_LINEUP, formation: '3-3-4'});

        expect(draft.formation).toBe('4-4-2');
        expect(draft.slots.FWD3).toBeUndefined();
    });
});

describe('changeFormation', () => {
    it('sends the last players of a shorter line to the bench and leaves empty slots in a longer one', () => {
        // Expected: from 4-3-3 to 3-5-2 the 4th defender (5) and the 3rd forward (13) leave; MID4 and MID5 stay empty.
        const draft = changeFormation(draftFromLineup(MY_LINEUP), '3-5-2');

        expect(draft.slots).toMatchObject({DEF1: 2, DEF2: 3, DEF3: 4, MID1: 7, MID2: 8, MID3: 9, MID4: null, MID5: null, FWD1: 11, FWD2: 12});
        expect(startersCount(draft)).toBe(9);
    });

    it('removes the captaincy of a captain sent to the bench', () => {
        // Expected: captain 13 (third forward) is benched in a 4-4-2, so there is no captain.
        const draft = changeFormation({...draftFromLineup(MY_LINEUP), captainId: 13}, '4-4-2');

        expect(draft.captainId).toBeNull();
    });
});

describe('assignPlayer, clearSlot and toggleCaptain', () => {
    it('puts a substitute in a slot and sends its player to the bench', () => {
        // Expected: DEF1 = 6 (the substitute) and defender 2 no longer a starter.
        const draft = assignPlayer(draftFromLineup(MY_LINEUP), 'DEF1', 6);

        expect(draft.slots.DEF1).toBe(6);
        expect(Object.values(draft.slots)).not.toContain(2);
    });

    it('swaps two starters of the same line', () => {
        // Expected: DEF1 = 4 and DEF3 = 2.
        const draft = assignPlayer(draftFromLineup(MY_LINEUP), 'DEF1', 4);

        expect(draft.slots).toMatchObject({DEF1: 4, DEF3: 2});
    });

    it('empties a slot and removes the captaincy of that player', () => {
        // Expected: FWD1 empty, 10 starters and no captain.
        const draft = clearSlot(draftFromLineup(MY_LINEUP), 'FWD1');

        expect(draft.slots.FWD1).toBeNull();
        expect(startersCount(draft)).toBe(10);
        expect(draft.captainId).toBeNull();
    });

    it('gives the captaincy and takes it away on the second time', () => {
        // Expected: captain 12, then no captain.
        const withCaptain = toggleCaptain(draftFromLineup(MY_LINEUP), 12);

        expect(withCaptain.captainId).toBe(12);
        expect(toggleCaptain(withCaptain, 12).captainId).toBeNull();
    });
});

describe('firstEmptySlot, canCover and squadCounts', () => {
    it('finds the first empty slot of a line, or null when it is full', () => {
        // Expected: null in the full defence; MID2 after emptying it.
        const draft = draftFromLineup(MY_LINEUP);

        expect(firstEmptySlot(draft, 'DEF')).toBeNull();
        expect(firstEmptySlot(clearSlot(draft, 'MID2'), 'MID')).toBe('MID2');
    });

    it('says which formations the squad can complete', () => {
        // Expected: the squad (1 GK, 5 DEF, 4 MID, 4 FWD) completes 5-4-1 but not 3-5-2 (5 midfielders).
        const counts = squadCounts(buildTeamSquad());

        expect(counts).toEqual({GK: 1, DEF: 5, MID: 4, FWD: 4});
        expect(canCover('5-4-1', counts)).toBe(true);
        expect(canCover('3-5-2', counts)).toBe(false);
    });
});

describe('toSaveInput and sameDraft', () => {
    it('sends only the filled slots', () => {
        // Expected: an empty 4-4-2 with only a goalkeeper sends one starter and no captain.
        const draft = assignPlayer(emptyDraft('4-4-2'), 'GK1', 1);

        expect(toSaveInput(draft)).toEqual({formation: '4-4-2', players: [{slot: 'GK1', playerPropertyId: 1}], captainId: null});
    });

    it('detects the changes of a draft', () => {
        // Expected: equal to itself, different after changing the captain.
        const draft = draftFromLineup(MY_LINEUP);

        expect(sameDraft(draft, draftFromLineup(MY_LINEUP))).toBe(true);
        expect(sameDraft(draft, toggleCaptain(draft, 12))).toBe(false);
    });
});
