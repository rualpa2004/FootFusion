import type { LoaderFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readLastLeague, rememberLastLeague } from '../../../src/router/last-league';
import { lineupShortcutLoader, teamLoader } from '../../../src/router/team-loaders';
import { ApiError } from '../../../src/services/api.client';
import { getMyLeagues } from '../../../src/services/league.service';
import { getLineup, getTeam } from '../../../src/services/team.service';
import { MY_LEAGUE } from '../../helpers/league-fixtures';
import { MY_LINEUP, MY_TEAM, OTHER_TEAM } from '../../helpers/team-fixtures';

vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));
vi.mock('../../../src/services/league.service', () => ({getMyLeagues: vi.fn()}));
vi.mock('../../../src/services/team.service', () => ({getTeam: vi.fn(), getLineup: vi.fn()}));

function loaderArgs(url: string, params: Record<string, string>): LoaderFunctionArgs {
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

describe('teamLoader', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(getMyLeagues).mockResolvedValue([MY_LEAGUE]);
        vi.mocked(getTeam).mockResolvedValue(MY_TEAM);
        vi.mocked(getLineup).mockResolvedValue(MY_LINEUP);
    });

    it('loads the user own team of the league and remembers the league', async () => {
        // Expected: the team id of MY_LEAGUE (21), the next matchday (no matchday sent) and league 5 remembered.
        const result = await teamLoader(loaderArgs('http://localhost/leagues/5/team', {leagueId: '5'}));

        expect(getTeam).toHaveBeenCalledWith(5, 21);
        expect(getLineup).toHaveBeenCalledWith(5, 21, undefined);
        expect(result).toEqual({league: {id: 5, name: 'Liga de la Facultad'}, team: MY_TEAM, lineup: MY_LINEUP});
        expect(readLastLeague()).toBe(5);
    });

    it('loads the team of another member on the matchday of the URL', async () => {
        // Expected: team 102 and matchday 12 requested.
        vi.mocked(getTeam).mockResolvedValue(OTHER_TEAM);

        await teamLoader(loaderArgs('http://localhost/leagues/5/teams/102?jornada=12', {leagueId: '5', teamId: '102'}));

        expect(getTeam).toHaveBeenCalledWith(5, 102);
        expect(getLineup).toHaveBeenCalledWith(5, 102, 12);
    });

    it('shows the next matchday when the one of the URL is not available', async () => {
        // Expected: a 400 for matchday 99, then the next matchday requested and returned.
        vi.mocked(getLineup).mockRejectedValueOnce(new ApiError(400, 'Matchday not available in this league'));

        const result = await teamLoader(loaderArgs('http://localhost/leagues/5/team?jornada=99', {leagueId: '5'}));

        expect(vi.mocked(getLineup).mock.calls).toEqual([[5, 21, 99], [5, 21, undefined]]);
        expect(result.lineup).toBe(MY_LINEUP);
    });

    it('returns no lineup while the league has no matchdays', async () => {
        // Expected: lineup null (404 "The league has no matchdays"), the team still loaded.
        vi.mocked(getLineup).mockRejectedValue(new ApiError(404, 'The league has no matchdays'));

        const result = await teamLoader(loaderArgs('http://localhost/leagues/5/team', {leagueId: '5'}));

        expect(result.lineup).toBeNull();
        expect(result.team).toBe(MY_TEAM);
    });

    it('answers 404 for a league of which the user is not a member, and forgets it', async () => {
        // Expected: a 404 response for league 9 and the remembered league 9 removed.
        rememberLastLeague(9);

        const thrown = await thrownBy(() => teamLoader(loaderArgs('http://localhost/leagues/9/team', {leagueId: '9'})));

        expect(thrown).toMatchObject({init: {status: 404}});
        expect(readLastLeague()).toBeNull();
        expect(getTeam).not.toHaveBeenCalled();
    });

    it('answers 404 for a team of another league', async () => {
        // Expected: the 404 of GET /teams/:teamId becomes the "not found" page.
        vi.mocked(getTeam).mockRejectedValue(new ApiError(404, 'Team not found'));

        const thrown = await thrownBy(() => teamLoader(loaderArgs('http://localhost/leagues/5/teams/77', {leagueId: '5', teamId: '77'})));

        expect(thrown).toMatchObject({init: {status: 404}});
    });
});

describe('lineupShortcutLoader', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('opens the lineup of the last league opened', async () => {
        // Expected: a redirect to /leagues/5/team.
        rememberLastLeague(5);

        const thrown = await thrownBy(() => lineupShortcutLoader());

        expect((thrown as Response).headers.get('Location')).toBe('/leagues/5/team');
    });

    it('opens the list of leagues when no league was opened', async () => {
        // Expected: a redirect to /leagues.
        const thrown = await thrownBy(() => lineupShortcutLoader());

        expect((thrown as Response).headers.get('Location')).toBe('/leagues');
    });
});
