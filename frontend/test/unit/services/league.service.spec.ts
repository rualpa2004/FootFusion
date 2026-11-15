import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STANDARD_SCORING } from '../../../src/config/league.constants';
import { ApiError, apiRequest } from '../../../src/services/api.client';
import {
    createLeague,
    getCompetitions,
    getLeague,
    getLeagueSpanishErrorMessage,
    getMyLeagues,
    getPlayedMatchdays,
    joinLeague,
    renameLeague
} from '../../../src/services/league.service';

vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

// Keeps the real ApiError class but replaces the HTTP call to the backend.
vi.mock('../../../src/services/api.client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/api.client')>()),
    apiRequest: vi.fn()
}));

describe('league requests', () => {
    beforeEach(() => {
        vi.mocked(apiRequest).mockResolvedValue({});
    });

    it('requests the competitions, the user leagues and one league', async () => {
        // Expected: GET /competitions, GET /leagues and GET /leagues/5.
        await getCompetitions();
        await getMyLeagues();
        await getLeague(5);

        expect(vi.mocked(apiRequest).mock.calls.map(([path]) => path)).toEqual(['/competitions', '/leagues', '/leagues/5']);
    });

    it('creates a league with a POST to /leagues', async () => {
        // Expected: POST /leagues with the input as JSON body.
        const input = {
            name: 'Liga', competitionIds: [1], scoring: STANDARD_SCORING, pointReward: 100_000,
            captainEnabled: false, multipliers: {enabled: false}
        };

        await createLeague(input);

        expect(apiRequest).toHaveBeenCalledWith('/leagues', {method: 'POST', body: JSON.stringify(input)});
    });

    it('joins with a POST to /leagues/join', async () => {
        // Expected: POST /leagues/join with {joinCode, teamName}.
        await joinLeague('A7KQ2M', 'Los Galácticos');

        expect(apiRequest).toHaveBeenCalledWith('/leagues/join', {
            method: 'POST',
            body: JSON.stringify({joinCode: 'A7KQ2M', teamName: 'Los Galácticos'})
        });
    });

    it('renames with a PATCH to /leagues/:id/name', async () => {
        // Expected: PATCH /leagues/5/name with {name}.
        await renameLeague(5, 'Nuevo nombre');

        expect(apiRequest).toHaveBeenCalledWith('/leagues/5/name', {method: 'PATCH', body: JSON.stringify({name: 'Nuevo nombre'})});
    });

    it('has no played matchdays until the scoring branch exists', async () => {
        // Expected: an empty list and no request to the backend.
        await expect(getPlayedMatchdays(5)).resolves.toEqual([]);
        expect(apiRequest).not.toHaveBeenCalled();
    });
});

describe('getLeagueSpanishErrorMessage', () => {
    it.each([
        ['Unknown competition', 'Alguna de las competiciones elegidas no existe.'],
        ['Only the owner can rename the league', 'Solo el propietario puede cambiar el nombre de la liga.'],
        ['The user is banned', 'Tu cuenta está bloqueada.'],
        ['Not enough free agents to draw a squad (GK)', 'No quedan suficientes jugadores libres para formar tu plantilla.']
    ])('translates "%s"', (message, expected) => {
        // Expected: the Spanish text of the backend message.
        expect(getLeagueSpanishErrorMessage(new ApiError(400, message))).toBe(expected);
    });

    it('uses a generic message for unknown errors', () => {
        // Expected: "Ha ocurrido un error inesperado." for an unknown API message and for a network error.
        expect(getLeagueSpanishErrorMessage(new ApiError(500, 'Internal server error'))).toBe('Ha ocurrido un error inesperado.');
        expect(getLeagueSpanishErrorMessage(new TypeError('Failed to fetch'))).toBe('Ha ocurrido un error inesperado.');
    });
});
