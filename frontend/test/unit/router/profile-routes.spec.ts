import type { ActionFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHANGE_PASSWORD_INTENT, profileAction, RENAME_INTENT } from '../../../src/router/profile-actions';
import { profileLoader } from '../../../src/router/profile-loaders';
import { getSignInMethod, sendPasswordChangeEmail, updateProfile } from '../../../src/services/auth.service';
import { getMyLeagues } from '../../../src/services/league.service';
import { MY_LEAGUE } from '../../helpers/league-fixtures';

// The loader and the action are tested in isolation: the services are test doubles.
vi.mock('../../../src/services/auth.service', () => ({
    getSignInMethod: vi.fn(),
    sendPasswordChangeEmail: vi.fn(),
    updateProfile: vi.fn()
}));
vi.mock('../../../src/services/league.service', () => ({
    getMyLeagues: vi.fn()
}));

function submit(fields: Record<string, string>): ActionFunctionArgs {
    const request = new Request('http://localhost/profile', {method: 'POST', body: new URLSearchParams(fields)});
    return {request, params: {}, context: {}} as ActionFunctionArgs;
}

describe('profileLoader', () => {
    it('loads the leagues of the user and how they sign in', async () => {
        // Expected: the leagues of GET /leagues and the sign-in method of the Firebase account.
        vi.mocked(getMyLeagues).mockResolvedValue([MY_LEAGUE]);
        vi.mocked(getSignInMethod).mockReturnValue('google');

        await expect(profileLoader()).resolves.toEqual({leagues: [MY_LEAGUE], signInMethod: 'google'});
    });
});

describe('profileAction', () => {
    const MANAGER_NAME_ERROR = 'El nombre de mánager debe tener entre 3 y 30 caracteres.';

    describe('when renaming', () => {
        beforeEach(() => {
            vi.mocked(updateProfile).mockResolvedValue({
                id: 1, name: 'Apex United', email: 'apex@example.com', role: 'USER', registerDate: '2026-09-15'
            });
        });

        it('saves the trimmed name', async () => {
            // Expected: updateProfile("Apex United") and nameUpdated = true.
            const result = await profileAction(submit({intent: RENAME_INTENT, name: '  Apex United  '}));

            expect(updateProfile).toHaveBeenCalledWith('Apex United');
            expect(result).toEqual({nameUpdated: true});
        });

        it.each([
            ['empty', '   '],
            ['shorter than 3 characters once trimmed', ' Al '],
            ['longer than 30 characters', 'A'.repeat(31)]
        ])('rejects a name that is %s without calling the API', async (_case, name) => {
            // Expected: fieldErrors.name with the 3-30 limits and updateProfile() not called.
            const result = await profileAction(submit({intent: RENAME_INTENT, name}));

            expect(result).toEqual({fieldErrors: {name: MANAGER_NAME_ERROR}});
            expect(updateProfile).not.toHaveBeenCalled();
        });

        it('returns the service error as a form error', async () => {
            // Expected: formError with the message of the service.
            vi.mocked(updateProfile).mockRejectedValue(new Error('Ha ocurrido un error inesperado.'));

            const result = await profileAction(submit({intent: RENAME_INTENT, name: 'Apex United'}));

            expect(result).toEqual({formError: 'Ha ocurrido un error inesperado.'});
        });
    });

    describe('when asking to change the password', () => {
        it('sends the email and returns the masked address', async () => {
            // Expected: sendPasswordChangeEmail() called, no name saved, and the address masked as in the other notices.
            vi.mocked(sendPasswordChangeEmail).mockResolvedValue('apex.manager@gmail.com');

            const result = await profileAction(submit({intent: CHANGE_PASSWORD_INTENT}));

            expect(result).toEqual({passwordEmailSentTo: 'a***r@gmail.com'});
            expect(updateProfile).not.toHaveBeenCalled();
        });

        it('returns the service error as a form error', async () => {
            // Expected: formError with the message of the service.
            vi.mocked(sendPasswordChangeEmail).mockRejectedValue(new Error('Demasiados intentos. Inténtalo más tarde.'));

            const result = await profileAction(submit({intent: CHANGE_PASSWORD_INTENT}));

            expect(result).toEqual({formError: 'Demasiados intentos. Inténtalo más tarde.'});
        });
    });
});
