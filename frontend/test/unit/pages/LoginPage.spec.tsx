import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../../src/pages/LoginPage';
import { renderWithRouter } from '../../helpers/render-with-router';

function renderLoginPage({justRegistered = false, action = vi.fn(async () => null) as ActionFunction}: {justRegistered?: boolean; action?: ActionFunction} = {}) {
    renderWithRouter({
        path: '/login',
        element: <LoginPage/>,
        loader: () => ({justRegistered}),
        action
    });
    return {action};
}

async function fillAndSubmit(email: string, password: string) {
    await userEvent.type(await screen.findByLabelText('Correo electrónico'), email);
    await userEvent.type(screen.getByLabelText('Contraseña'), password);
    await userEvent.click(screen.getByRole('button', {name: 'Iniciar sesión'}));
}

describe('LoginPage', () => {
    it('renders the login form', async () => {
        // Expected: title, email and password fields, "Recordarme", the submit button and the register link.
        renderLoginPage();

        expect(await screen.findByRole('heading', {name: 'Bienvenido de nuevo'})).toBeInTheDocument();
        expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('Recordarme')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Iniciar sesión'})).toBeEnabled();
        expect(screen.getByRole('link', {name: 'Crea una cuenta'})).toHaveAttribute('href', '/register');
    });

    it('shows the "account created" message when the loader says so', async () => {
        // Expected: the success message is visible.
        renderLoginPage({justRegistered: true});

        expect(await screen.findByText('Cuenta creada correctamente. Ya puedes iniciar sesión.')).toBeInTheDocument();
    });

    it('does not show the "account created" message in a normal visit', async () => {
        // Expected: no success message.
        renderLoginPage();

        await screen.findByRole('heading', {name: 'Bienvenido de nuevo'});
        expect(screen.queryByText('Cuenta creada correctamente. Ya puedes iniciar sesión.')).not.toBeInTheDocument();
    });

    it('sends the typed values to the route action', async () => {
        // Expected: the action receives "email" and "password" in the form data (read by their name attribute).
        // The values are captured and checked outside the action: an expect() failing inside it
        // would be caught by React Router and the test would not notice.
        let sentData: Record<string, FormDataEntryValue> = {};
        const action = vi.fn(async ({request}: {request: Request}) => {
            sentData = Object.fromEntries(await request.formData());
            return null;
        });
        renderLoginPage({action});

        await fillAndSubmit('apex@example.com', 'secret123');

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(sentData).toEqual({email: 'apex@example.com', password: 'secret123'});
    });

    it('shows the field errors returned by the action', async () => {
        // Expected: each message under its field and both inputs marked as invalid (aria-invalid="true").
        renderLoginPage({
            action: vi.fn(async () => ({
                fieldErrors: {email: 'El correo no tiene un formato válido.', password: 'Introduce tu contraseña.'}
            }))
        });

        await fillAndSubmit('apex@', 'x');

        expect(await screen.findByText('El correo no tiene un formato válido.')).toBeInTheDocument();
        expect(screen.getByText('Introduce tu contraseña.')).toBeInTheDocument();
        expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows the form error returned by the action', async () => {
        // Expected: an alert with the message.
        renderLoginPage({action: vi.fn(async () => ({formError: 'Correo o contraseña incorrectos.'}))});

        await fillAndSubmit('apex@example.com', 'wrong-pass1');

        expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    });

    it('hides the "account created" message once the user submits the form', async () => {
        // Expected: the success message disappears and only the error is shown.
        renderLoginPage({
            justRegistered: true,
            action: vi.fn(async () => ({formError: 'Correo o contraseña incorrectos.'}))
        });

        await fillAndSubmit('apex@example.com', 'wrong-pass1');

        await screen.findByRole('alert');
        expect(screen.queryByText('Cuenta creada correctamente. Ya puedes iniciar sesión.')).not.toBeInTheDocument();
    });

    it('disables the button and shows the pending label while submitting', async () => {
        // Expected: "Iniciando sesión..." and disabled; back to "Iniciar sesión" when the action finishes.
        let finishAction: (value: null) => void = () => {};
        renderLoginPage({action: vi.fn(() => new Promise<null>((resolve) => { finishAction = resolve; }))});

        await fillAndSubmit('apex@example.com', 'secret123');

        const pendingButton = await screen.findByRole('button', {name: 'Iniciando sesión...'});
        expect(pendingButton).toBeDisabled();

        finishAction(null);
        expect(await screen.findByRole('button', {name: 'Iniciar sesión'})).toBeEnabled();
    });
});
