import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirebaseError } from 'firebase/app';
import { redirect, type ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GoogleSignInButton } from '../../../../src/components/auth/GoogleSignInButton';
import { signInWithGoogle } from '../../../../src/services/auth.service';
import { renderWithRouter } from '../../../helpers/render-with-router';

vi.mock('../../../../src/services/auth.service', () => ({
    signInWithGoogle: vi.fn()
}));

function renderGoogleButton(googleAction: ActionFunction) {
    let sentData: Record<string, FormDataEntryValue> = {};
    const action = vi.fn(async (args: Parameters<ActionFunction>[0]) => {
        sentData = Object.fromEntries(await args.request.clone().formData());
        return googleAction(args);
    });

    const result = renderWithRouter({
        path: '/login',
        element: <GoogleSignInButton label="Continuar con Google"/>,
        routes: [{path: '/auth/google', action}]
    });
    return {...result, action, getSentData: () => sentData};
}

describe('GoogleSignInButton', () => {
    it('renders the button with its label and the legal notice', () => {
        // Expected: "Continuar con Google" and the terms notice for Google sign-ups.
        renderGoogleButton(vi.fn(async () => null));

        expect(screen.getByRole('button', {name: 'Continuar con Google'})).toBeEnabled();
        expect(screen.getByText(/Al continuar con Google aceptas/)).toBeInTheDocument();
    });

    it('opens the Google window and sends the result to /auth/google', async () => {
        // Expected: signInWithGoogle() called, the /auth/google action called without error code,
        // and its redirect followed.
        vi.mocked(signInWithGoogle).mockResolvedValue(true);
        const {action, getSentData, router} = renderGoogleButton(vi.fn(async () => redirect('/completar-perfil')));

        await userEvent.click(screen.getByRole('button', {name: 'Continuar con Google'}));

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(signInWithGoogle).toHaveBeenCalledTimes(1);
        expect(getSentData()).toEqual({});
        await waitFor(() => expect(router.state.location.pathname).toBe('/completar-perfil'));
    });

    it('does nothing when the user closes the Google window', async () => {
        // Expected: the action is not called and no error is shown.
        vi.mocked(signInWithGoogle).mockResolvedValue(false);
        const {action} = renderGoogleButton(vi.fn(async () => null));

        await userEvent.click(screen.getByRole('button', {name: 'Continuar con Google'}));

        await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
        expect(action).not.toHaveBeenCalled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sends the error code of the Google window and shows the message returned by the action', async () => {
        // Expected: popupErrorCode sent to the action and its formError shown in an alert.
        vi.mocked(signInWithGoogle).mockRejectedValue(new FirebaseError('auth/popup-blocked', 'Firebase error'));
        const {getSentData} = renderGoogleButton(vi.fn(async () => ({formError: 'El navegador ha bloqueado la ventana de Google.'})));

        await userEvent.click(screen.getByRole('button', {name: 'Continuar con Google'}));

        expect(await screen.findByRole('alert')).toHaveTextContent('El navegador ha bloqueado la ventana de Google.');
        expect(getSentData()).toEqual({popupErrorCode: 'auth/popup-blocked'});
    });

    it('shows the pending label while the action runs', async () => {
        // Expected: "Conectando con Google..." disabled while /auth/google has not answered.
        vi.mocked(signInWithGoogle).mockResolvedValue(true);
        renderGoogleButton(vi.fn(() => new Promise<null>(() => {})));

        await userEvent.click(screen.getByRole('button', {name: 'Continuar con Google'}));

        expect(await screen.findByRole('button', {name: 'Conectando con Google...'})).toBeDisabled();
    });
});
