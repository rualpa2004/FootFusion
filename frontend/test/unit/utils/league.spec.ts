import { describe, expect, it } from 'vitest';
import { buildInviteLink, buildStandings, formatScoringValue, shouldShowPodium } from '../../../src/utils/league';
import { member } from '../../helpers/league-fixtures';

describe('buildStandings', () => {
    it('keeps the order of the backend and marks the current user', () => {
        // Expected: positions 1, 2 and 3 in the same order, only user 1 marked as current user.
        const standings = buildStandings([member(2, 30), member(1, 20), member(3, 10)], 1);

        expect(standings.map((standing) => [standing.position, standing.member.userId, standing.isCurrentUser])).toEqual([
            [1, 2, false],
            [2, 1, true],
            [3, 3, false]
        ]);
    });
});

describe('shouldShowPodium', () => {
    it('shows it with 3 or more teams and some points', () => {
        // Expected: true.
        expect(shouldShowPodium(buildStandings([member(1, 5), member(2, 0), member(3, 0)], 1))).toBe(true);
    });

    it('hides it in a new league where nobody has scored', () => {
        // Expected: false with all the teams at 0 points.
        expect(shouldShowPodium(buildStandings([member(1, 0), member(2, 0), member(3, 0)], 1))).toBe(false);
    });

    it('hides it with fewer than 3 teams', () => {
        // Expected: false with 2 teams, even with points.
        expect(shouldShowPodium(buildStandings([member(1, 10), member(2, 5)], 1))).toBe(false);
    });
});

describe('formatScoringValue', () => {
    it('shows the minutes as a maximum and the rest with their sign', () => {
        // Expected: "hasta 2", "+4" and "−2".
        expect(formatScoringValue('minutesMaxPoints', 2)).toBe('hasta 2');
        expect(formatScoringValue('forwardGoalPoints', 4)).toBe('+4');
        expect(formatScoringValue('redCardPenalty', -2)).toBe('−2');
    });
});

describe('buildInviteLink', () => {
    it('points to the join route of the web', () => {
        // Expected: "https://footfusion.app/leagues/join/A7KQ2M".
        expect(buildInviteLink('A7KQ2M', 'https://footfusion.app')).toBe('https://footfusion.app/leagues/join/A7KQ2M');
    });
});
