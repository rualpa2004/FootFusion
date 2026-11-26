import { describe, expect, it } from 'vitest';
import type { MyLeague } from '../../../src/services/league.service';
import { computeProfileStats, getInitials, hasProfilePage } from '../../../src/utils/profile';
import { MY_LEAGUE } from '../../helpers/league-fixtures';

function league(id: number, name: string, totalPoints: number, rank: number): MyLeague {
    return {...MY_LEAGUE, id, name, team: {...MY_LEAGUE.team, id: 100 + id, totalPoints, rank}};
}

describe('getInitials', () => {
    it.each([
        ['Apex Manager', 'AM'],
        ['ApexManager', 'AM'],
        ['  apex   manager  ', 'AM'],
        ['Apex de la Manga', 'AD'],
        ['pepe', 'P'],
        ['Ñandú Álvarez', 'ÑÁ'],
        ['😀 Fan', '😀F']
    ])('turns "%s" into "%s"', (name, initials) => {
        // Expected: the first letter of the first two words (a camel case name counts as two), in upper case.
        expect(getInitials(name)).toBe(initials);
    });
});

describe('computeProfileStats', () => {
    it('counts the leagues, adds up the points and keeps the best position with its league', () => {
        // Expected: 3 leagues, 305 + 281 + 236 = 822 points and the 1st place of "Liga de la Facultad".
        const stats = computeProfileStats([
            league(1, 'Amigos del barrio', 281, 2),
            league(2, 'Liga de la Facultad', 305, 1),
            league(3, 'Liga Premier', 236, 3)
        ]);

        expect(stats).toEqual({leaguesCount: 3, totalPoints: 822, bestRank: {rank: 1, leagueName: 'Liga de la Facultad'}});
    });

    it('keeps the first league of the list (the newest) when two share the best position', () => {
        // Expected: the 2nd place of "Nueva", the first one in the list.
        const stats = computeProfileStats([league(1, 'Nueva', 10, 2), league(2, 'Antigua', 50, 2)]);

        expect(stats.bestRank).toEqual({rank: 2, leagueName: 'Nueva'});
    });

    it('has no best position without leagues', () => {
        // Expected: 0 leagues, 0 points and bestRank null.
        expect(computeProfileStats([])).toEqual({leaguesCount: 0, totalPoints: 0, bestRank: null});
    });
});

describe('hasProfilePage', () => {
    it('gives the profile page to managers but not to the administrator', () => {
        // Expected: true for USER, false for ADMIN.
        expect(hasProfilePage({role: 'USER'})).toBe(true);
        expect(hasProfilePage({role: 'ADMIN'})).toBe(false);
    });
});
