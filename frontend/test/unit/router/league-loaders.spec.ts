import type { LoaderFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    joinLinkLoader,
    leagueDetailLoader,
    leaguesLoader
} from '../../../src/router/league-loaders';
import { peekPendingJoinCode, savePendingJoinCode } from '../../../src/router/pending-join';
import { ApiError } from '../../../src/services/api.client';
import { getLeague, getMyLeagues, getPlayedMatchdays } from '../../../src/services/league.service';
import { LEAGUE_DETAIL, MY_LEAGUE } from '../../helpers/league-fixtures';

vi.mock('../../../src/services/league.service', () => ({
    getMyLeagues: vi.fn(),
    getLeague: vi.fn(),
    getCompetitions: vi.fn(),
    getPlayedMatchdays: vi.fn()
}));

function loaderArgs(url: string, params: Record<string, string> = {}): LoaderFunctionArgs {
    return {request: new Request(url), params, context: {}} as LoaderFunctionArgs;
}

/** Runs a loader that is expected to throw and returns what it threw. */
async function thrownBy(run: () => unknown): Promise<unknown> {
    try {
        await run();
    } catch (thrown) {
        return thrown;
    }
    throw new Error('The loader did not throw');
}

describe('joinLinkLoader', () => {
    it('saves the code of the link and redirects to the leagues page', async () => {
        // Expected: a redirect to /leagues and "A7KQ2M" saved as pending join code.
        const thrown = await thrownBy(() => joinLinkLoader(loaderArgs('http://localhost/leagues/join/a7kq2m', {code: 'a7kq2m'})));

        expect(thrown).toBeInstanceOf(Response);
        expect((thrown as Response).headers.get('Location')).toBe('/leagues');
        expect(peekPendingJoinCode()).toBe('A7KQ2M');
    });
});

describe('leaguesLoader', () => {
    it('returns the leagues and consumes the pending join code', async () => {
        // Expected: {leagues, pendingJoinCode: "A7KQ2M"} and the code no longer stored.
        vi.mocked(getMyLeagues).mockResolvedValue([MY_LEAGUE]);
        savePendingJoinCode('A7KQ2M');

        await expect(leaguesLoader()).resolves.toEqual({leagues: [MY_LEAGUE], pendingJoinCode: 'A7KQ2M'});
        expect(peekPendingJoinCode()).toBeNull();
    });

    it('keeps the pending join code when the leagues cannot be loaded', async () => {
        // Expected: the error propagated and the code still stored for after the login.
        vi.mocked(getMyLeagues).mockRejectedValue(new ApiError(401, 'Unauthorized'));
        savePendingJoinCode('A7KQ2M');

        await expect(leaguesLoader()).rejects.toThrow('Unauthorized');
        expect(peekPendingJoinCode()).toBe('A7KQ2M');
    });
});

describe('leagueDetailLoader', () => {
    beforeEach(() => {
        vi.mocked(getLeague).mockResolvedValue(LEAGUE_DETAIL);
        vi.mocked(getPlayedMatchdays).mockResolvedValue([1, 2]);
    });

    it('returns the league with the total standings by default', async () => {
        // Expected: getLeague(5), the played matchdays and selectedMatchday null.
        const result = await leagueDetailLoader(loaderArgs('http://localhost/leagues/5', {leagueId: '5'}));

        expect(getLeague).toHaveBeenCalledWith(5);
        expect(result).toEqual({league: LEAGUE_DETAIL, matchdays: [1, 2], selectedMatchday: null});
    });

    it('selects a played matchday from the URL', async () => {
        // Expected: selectedMatchday 2.
        const result = await leagueDetailLoader(loaderArgs('http://localhost/leagues/5?jornada=2', {leagueId: '5'}));

        expect(result.selectedMatchday).toBe(2);
    });

    it('ignores a matchday that has not been played', async () => {
        // Expected: selectedMatchday null for ?jornada=9.
        const result = await leagueDetailLoader(loaderArgs('http://localhost/leagues/5?jornada=9', {leagueId: '5'}));

        expect(result.selectedMatchday).toBeNull();
    });

    it.each([
        ['an invalid id', 'abc', undefined],
        ['a league that does not exist', '5', new ApiError(404, 'League not found')],
        ['a league the user is not a member of', '5', new ApiError(403, 'The user is not a member of this league')]
    ])('throws a 404 page for %s', async (_case, leagueId, error) => {
        // Expected: a route error response with status 404.
        if (error) {
            vi.mocked(getLeague).mockRejectedValue(error);
        }

        const thrown = await thrownBy(() => leagueDetailLoader(loaderArgs('http://localhost/leagues/x', {leagueId})));

        // data() wraps the body with its response options; the error page reads the status from them.
        expect((thrown as {init: ResponseInit}).init.status).toBe(404);
    });
});
