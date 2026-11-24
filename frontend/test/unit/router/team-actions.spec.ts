import type { ActionFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveLineupAction } from '../../../src/router/team-actions';
import { ApiError } from '../../../src/services/api.client';
import { saveLineup } from '../../../src/services/team.service';
import { MATCHDAY_13, MY_LINEUP } from '../../helpers/team-fixtures';

vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

// Keeps the real error translation but replaces the request
vi.mock('../../../src/services/team.service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/team.service')>()),
    saveLineup: vi.fn()
}));

const BODY = {formation: '4-4-2', players: [{slot: 'GK1', playerPropertyId: 1}], captainId: null, matchday: 13};

function actionArgs(body: object): ActionFunctionArgs {
    const request = new Request('http://localhost/leagues/5/team', {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    const params: Record<string, string> = {leagueId: '5'};
    return {request, params, context: {}} as ActionFunctionArgs;
}

describe('saveLineupAction', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('saves the lineup without the matchday field', async () => {
        // Expected: saveLineup(5, lineup) without "matchday" and {saved} as result.
        vi.mocked(saveLineup).mockResolvedValue(MY_LINEUP);

        const result = await saveLineupAction(actionArgs(BODY));

        expect(saveLineup).toHaveBeenCalledWith(5, {formation: '4-4-2', players: BODY.players, captainId: null});
        expect(result).toEqual({saved: MY_LINEUP});
    });

    it('says when the lineup was saved for the following matchday', async () => {
        // Expected: matchday 13 started while editing; saved for 14, so movedFrom = 13.
        const saved = {...MY_LINEUP, matchday: {...MATCHDAY_13, number: 14}};
        vi.mocked(saveLineup).mockResolvedValue(saved);

        const result = await saveLineupAction(actionArgs(BODY));

        expect(result).toEqual({saved, movedFrom: 13});
    });

    it('returns the error in Spanish', async () => {
        // Expected: the season-ended message.
        vi.mocked(saveLineup).mockRejectedValue(new ApiError(409, 'The season has ended'));

        const result = await saveLineupAction(actionArgs(BODY));

        expect(result).toEqual({formError: 'La temporada ha terminado: ya no se pueden cambiar las alineaciones.'});
    });
});
