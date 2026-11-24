import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../../../src/services/api.client';
import { getLineup, getLineupSpanishErrorMessage, getTeam, saveLineup } from '../../../src/services/team.service';

vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

// Keeps the real ApiError class but replaces the HTTP call to the backend.
vi.mock('../../../src/services/api.client', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/api.client')>()),
    apiRequest: vi.fn()
}));

describe('team and lineup requests', () => {
    beforeEach(() => {
        vi.mocked(apiRequest).mockResolvedValue({});
    });

    it('requests a team and its lineup, of the next matchday or of a given one', async () => {
        // Expected: GET /leagues/5/teams/21, .../lineup and .../lineup?matchday=12.
        await getTeam(5, 21);
        await getLineup(5, 21);
        await getLineup(5, 21, 12);

        expect(vi.mocked(apiRequest).mock.calls.map(([path]) => path)).toEqual([
            '/leagues/5/teams/21', '/leagues/5/teams/21/lineup', '/leagues/5/teams/21/lineup?matchday=12'
        ]);
    });

    it('saves the lineup with a PUT to /leagues/:id/lineup', async () => {
        // Expected: PUT with the formation, the starters and the captain as JSON.
        const input = {formation: '4-4-2', players: [{slot: 'GK1', playerPropertyId: 1}], captainId: null};

        await saveLineup(5, input);

        expect(apiRequest).toHaveBeenCalledWith('/leagues/5/lineup', {method: 'PUT', body: JSON.stringify(input)});
    });
});

describe('getLineupSpanishErrorMessage', () => {
    it.each([
        ['The season has ended', 'La temporada ha terminado: ya no se pueden cambiar las alineaciones.'],
        ['The captain must be a starter', 'El capitán tiene que ser uno de los titulares.'],
        ['Player 4 is not in the squad', 'Alguno de los jugadores ya no está en tu plantilla. Recarga la página.'],
        ['Player 4 can not play as DEF', 'Algún jugador está en una posición que no es la suya.'],
        ['Something else', 'Ha ocurrido un error inesperado.']
    ])('translates "%s"', (message, expected) => {
        // Expected: the Spanish message of each backend error.
        expect(getLineupSpanishErrorMessage(new ApiError(400, message))).toBe(expected);
    });

    it('uses the generic message for errors that do not come from the backend', () => {
        // Expected: "Ha ocurrido un error inesperado." for a network error.
        expect(getLineupSpanishErrorMessage(new TypeError('Failed to fetch'))).toBe('Ha ocurrido un error inesperado.');
    });
});
