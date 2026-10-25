import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CompleteProfilePage } from '../../../src/pages/CompleteProfilePage';
import { renderWithRouter } from '../../helpers/render-with-router';

vi.mock('../../../src/services/auth.service', () => ({}));

const GOOGLE_ACCOUNT = {email: 'rualpa2004@gmail.com', photoUrl: 'https://photos.example.com/apex.png'};

function renderCompleteProfilePage({
    account = GOOGLE_ACCOUNT as {email: string; photoUrl?: string},
    action = vi.fn(async () => null) as ActionFunction
} = {}) {
    renderWithRouter({path: '/completar-perfil', element: <CompleteProfilePage/>, loader: () => account, action});
    return {action};
}

/** Action double that records the form data it receives and returns `result`. */
function recordingAction(result: unknown = null) {
    const calls: Record<string, FormDataEntryValue>[] = [];
    const action = vi.fn(async ({request}: {request: Request}) => {
        calls.push(Object.fromEntries(await request.formData()));
        return result;
    });
    return {action, calls};
}

describe('CompleteProfilePage', () => {
    it('shows the Google account with its full email and photo', async () => {
        // Expected: the title, "Cuenta de Google", the email unmasked and the Google photo.
        renderCompleteProfilePage();

        expect(await screen.findByRole('heading', {name: 'Un último paso'})).toBeInTheDocument();
        expect(screen.getByText('Cuenta de Google')).toBeInTheDocument();
        expect(screen.getByText('rualpa2004@gmail.com')).toBeInTheDocument();
        expect(screen.getByRole('img', {name: 'Foto de tu cuenta de Google'}))
            .toHaveAttribute('src', 'https://photos.example.com/apex.png');
    });

    it('shows the generic icon when the Google account has no photo', async () => {
        // Expected: no <img> element, the generic avatar instead.
        renderCompleteProfilePage({account: {email: 'rualpa2004@gmail.com'}});

        const avatar = await screen.findByRole('img', {name: 'Foto de tu cuenta de Google'});
        expect(avatar.tagName).not.toBe('IMG');
    });

    it('starts with an empty manager name and shows the hint and the legal notice', async () => {
        // Expected: empty input, "Podrás cambiarlo más adelante desde tu perfil." and the terms notice.
        renderCompleteProfilePage();

        expect(await screen.findByLabelText('Nombre de mánager')).toHaveValue('');
        expect(screen.getByText('Podrás cambiarlo más adelante desde tu perfil.')).toBeInTheDocument();
        expect(screen.getByText(/Al continuar aceptas/)).toBeInTheDocument();
    });

    it('sends the manager name to the route action', async () => {
        // Expected: the action receives { name } without any intent.
        const {action, calls} = recordingAction();
        renderCompleteProfilePage({action});

        await userEvent.type(await screen.findByLabelText('Nombre de mánager'), 'ApexManager');
        await userEvent.click(screen.getByRole('button', {name: 'Empezar a jugar'}));

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(calls[0]).toEqual({name: 'ApexManager'});
    });

    it('sends the cancel intent with "Usar otra cuenta"', async () => {
        // Expected: the action receives intent=cancelSignUp (it deletes the account and goes to /login).
        const {action, calls} = recordingAction();
        renderCompleteProfilePage({action});

        await userEvent.click(await screen.findByRole('button', {name: 'Usar otra cuenta'}));

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(calls[0]).toEqual({intent: 'cancelSignUp'});
    });

    it('shows the field and form errors returned by the action', async () => {
        // Expected: the name error under the field (input marked invalid) and the form error in an alert.
        renderCompleteProfilePage({
            action: vi.fn(async () => ({fieldErrors: {name: 'Elige un nombre de mánager.'}, formError: 'Ha ocurrido un error inesperado.'}))
        });

        await userEvent.click(await screen.findByRole('button', {name: 'Empezar a jugar'}));

        expect(await screen.findByText('Elige un nombre de mánager.')).toBeInTheDocument();
        expect(screen.getByLabelText('Nombre de mánager')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('alert')).toHaveTextContent('Ha ocurrido un error inesperado.');
    });

    it('disables both buttons while the profile is being created', async () => {
        // Expected: "Creando perfil..." and "Usar otra cuenta" disabled until the action answers.
        renderCompleteProfilePage({action: vi.fn(() => new Promise<null>(() => {}))});

        await userEvent.type(await screen.findByLabelText('Nombre de mánager'), 'ApexManager');
        await userEvent.click(screen.getByRole('button', {name: 'Empezar a jugar'}));

        expect(await screen.findByRole('button', {name: 'Creando perfil...'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Usar otra cuenta'})).toBeDisabled();
    });
});
