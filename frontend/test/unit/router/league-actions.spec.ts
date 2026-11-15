import type { ActionFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STANDARD_SCORING } from '../../../src/config/league.constants';
import {
    createLeagueAction,
    joinLeagueAction,
    renameLeagueAction
} from '../../../src/router/league-actions';
import { ApiError } from '../../../src/services/api.client';
import { createLeague, joinLeague, renameLeague } from '../../../src/services/league.service';
import { JOINED_LEAGUE, LA_LIGA, PREMIER } from '../../helpers/league-fixtures';

vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

// The actions are tested in isolation: the league requests are test doubles. The error messages keep
// the real translation, so the tests also check what the user reads.
vi.mock('../../../src/services/league.service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../src/services/league.service')>()),
    createLeague: vi.fn(),
    joinLeague: vi.fn(),
    renameLeague: vi.fn()
}));

/** Arguments React Router passes to an action when a form with these fields is submitted. */
function submit(fields: [string, string][], params: Record<string, string> = {}): ActionFunctionArgs {
    const request = new Request('http://localhost/form', {method: 'POST', body: new URLSearchParams(fields)});
    return {request, params, context: {}} as ActionFunctionArgs;
}

const VALID_CREATE: [string, string][] = [
    ['name', '  Liga de la Facultad  '],
    ['competitionIds', String(LA_LIGA.id)],
    ['competitionIds', String(PREMIER.id)],
    ['pointReward', '100000']
];

describe('createLeagueAction', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(createLeague).mockResolvedValue(JOINED_LEAGUE);
    });

    it('sends the standard scoring, no captain and no multipliers by default', async () => {
        // Expected: createLeague called with the trimmed name and other parameters
        const result = await createLeagueAction(submit(VALID_CREATE));

        expect(result).toEqual({joined: JOINED_LEAGUE});
        expect(createLeague).toHaveBeenCalledWith({
            name: 'Liga de la Facultad',
            teamName: undefined,
            competitionIds: [LA_LIGA.id, PREMIER.id],
            scoring: STANDARD_SCORING,
            pointReward: 100_000,
            captainEnabled: false,
            multipliers: {enabled: false}
        });
    });

    it('sends the custom scoring values when the custom mode is chosen', async () => {
        // Expected: the scoring sent is customed
        const customScoring = {...STANDARD_SCORING, forwardGoalPoints: 5, redCardPenalty: -4};
        const scoringFields = Object.entries(customScoring).map(([key, value]): [string, string] => [`scoring.${key}`, String(value)]);

        await createLeagueAction(submit([...VALID_CREATE, ['scoringMode', 'custom'], ...scoringFields]));

        expect(vi.mocked(createLeague).mock.calls[0]![0].scoring).toEqual({
            ...STANDARD_SCORING, forwardGoalPoints: 5, redCardPenalty: -4
        });
    });

    it('ignores scoring values outside the allowed options', async () => {
        // Expected: the not allowed assistPoints 9 is replaced by the standard value 3.
        await createLeagueAction(submit([...VALID_CREATE, ['scoringMode', 'custom'], ['scoring.assistPoints', '9']]));

        expect(vi.mocked(createLeague).mock.calls[0]![0].scoring.assistPoints).toBe(3);
    });

    it('sends the captain and the multipliers when they are enabled', async () => {
        // Expected: captainEnabled true and multipliers {enabled, 5 matchdays, x3, BOTH}.
        await createLeagueAction(submit([
            ...VALID_CREATE,
            ['captainEnabled', 'on'],
            ['multipliersEnabled', 'on'],
            ['multiplierFinalMatchdays', '5'],
            ['multiplierFactor', '3'],
            ['multiplierTarget', 'BOTH']
        ]));

        const input = vi.mocked(createLeague).mock.calls[0]![0];
        expect(input.captainEnabled).toBe(true);
        expect(input.multipliers).toEqual({enabled: true, finalMatchdays: 5, factor: 3, target: 'BOTH'});
    });

    it('validates the name, the team name and the number of competitions', async () => {
        // Expected: three field errors and no request to the backend.
        const result = await createLeagueAction(submit([
            ['name', 'ab'],
            ['teamName', 'xy'],
            ...['1', '2', '3', '4'].map((id): [string, string] => ['competitionIds', id])
        ]));

        expect(result.fieldErrors).toEqual({
            name: 'El nombre de la liga debe tener entre 3 y 30 caracteres.',
            teamName: 'El nombre del equipo debe tener entre 3 y 30 caracteres.',
            competitionIds: 'Elige entre 1 y 3 competiciones.'
        });
        expect(createLeague).not.toHaveBeenCalled();
    });

    it('requires at least one competition', async () => {
        // Expected: fieldErrors.competitionIds when none is chosen.
        const result = await createLeagueAction(submit([['name', 'Liga de la Facultad']]));

        expect(result.fieldErrors?.competitionIds).toBe('Elige entre 1 y 3 competiciones.');
    });

    it('translates the errors of the backend', async () => {
        // Expected: formError "Alguna de las competiciones elegidas no existe."
        vi.mocked(createLeague).mockRejectedValue(new ApiError(400, 'Unknown competition'));

        const result = await createLeagueAction(submit(VALID_CREATE));

        expect(result).toEqual({formError: 'Alguna de las competiciones elegidas no existe.'});
    });
});

describe('joinLeagueAction', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(joinLeague).mockResolvedValue(JOINED_LEAGUE);
    });

    it('joins with the code in capital letters and the team name', async () => {
        // Expected: joinLeague("A7KQ2M", "Los Galácticos") and the joined league returned.
        const result = await joinLeagueAction(submit([['joinCode', ' a7kq2m '], ['teamName', 'Los Galácticos']]));

        expect(joinLeague).toHaveBeenCalledWith('A7KQ2M', 'Los Galácticos');
        expect(result).toEqual({joined: JOINED_LEAGUE});
    });

    it('does not send an empty team name', async () => {
        // Expected: joinLeague("A7KQ2M", undefined), so the backend uses the manager name.
        await joinLeagueAction(submit([['joinCode', 'A7KQ2M'], ['teamName', '   ']]));

        expect(joinLeague).toHaveBeenCalledWith('A7KQ2M', undefined);
    });

    it.each(['ABC12', 'ABC1234', 'ABC-12', ''])('rejects the malformed code "%s"', async (joinCode) => {
        // Expected: fieldErrors.joinCode and no request to the backend.
        const result = await joinLeagueAction(submit([['joinCode', joinCode]]));

        expect(result.fieldErrors?.joinCode).toBe('El código debe tener 6 letras o números.');
        expect(joinLeague).not.toHaveBeenCalled();
    });

    it.each([
        [404, 'League not found', 'No existe ninguna liga con ese código.'],
        [409, 'The league is full', 'La liga está completa: ya tiene 8 equipos.'],
        [409, 'The user is already a member of this league', 'Ya formas parte de esta liga.'],
        [403, 'The user was expelled from this league', 'Fuiste expulsado de esta liga y no puedes volver a unirte.']
    ])('translates the %i "%s" error', async (status, message, expected) => {
        // Expected: the Spanish message as formError.
        vi.mocked(joinLeague).mockRejectedValue(new ApiError(status, message));

        const result = await joinLeagueAction(submit([['joinCode', 'A7KQ2M']]));

        expect(result).toEqual({formError: expected});
    });
});

describe('renameLeagueAction', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renames the league of the URL', async () => {
        // Expected: renameLeague(5, "Nuevo nombre") and {renamed: true}.
        const result = await renameLeagueAction(submit([['name', ' Nuevo nombre ']], {leagueId: '5'}));

        expect(renameLeague).toHaveBeenCalledWith(5, 'Nuevo nombre');
        expect(result).toEqual({renamed: true});
    });

    it('validates the length of the new name', async () => {
        // Expected: fieldErrors.name and no request to the backend.
        const result = await renameLeagueAction(submit([['name', 'x'.repeat(31)]], {leagueId: '5'}));

        expect(result.fieldErrors?.name).toBe('El nombre de la liga debe tener entre 3 y 30 caracteres.');
        expect(renameLeague).not.toHaveBeenCalled();
    });

    it('translates the error of a league already renamed', async () => {
        // Expected: formError "El nombre de la liga ya se cambió una vez."
        vi.mocked(renameLeague).mockRejectedValue(new ApiError(409, 'The league has already been renamed'));

        const result = await renameLeagueAction(submit([['name', 'Nuevo nombre']], {leagueId: '5'}));

        expect(result).toEqual({formError: 'El nombre de la liga ya se cambió una vez.'});
    });
});
