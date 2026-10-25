import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../../src/pages/LoginPage';
import { renderWithRouter } from '../../helpers/render-with-router';

vi.mock('../../../src/services/auth.service', () => ({
    signInWithGoogle: vi.fn()
}));

const REGISTERED_MESSAGE = 'Cuenta creada. Te hemos enviado un correo a a***x@example.com para verificarla.';

function renderLoginPage({
    registeredEmail = null,
    action = vi.fn(async () => null) as ActionFunction
}: {registeredEmail?: string | null; action?: ActionFunction} = {}) {
    renderWithRouter({
        path: '/login',
        element: <LoginPage/>,
        loader: () => ({registeredEmail}),
        action
    });
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

    it('offers Google below the email form', async () => {
        // Expected: the "o por Google" separator and the "Continuar con Google" button.
        renderLoginPage();

        expect(await screen.findByText('o por Google')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Continuar con Google'})).toBeInTheDocument();
    });

    it('shows the "check your inbox" message with the masked email after a registration', async () => {
        // Expected: the success message naming the masked email.
        renderLoginPage({registeredEmail: 'a***x@example.com'});

        expect(await screen.findByRole('status')).toHaveTextContent(REGISTERED_MESSAGE);
    });

    it('does not show the registration message in a normal visit', async () => {
        // Expected: no message.
        renderLoginPage();

        await screen.findByRole('heading', {name: 'Bienvenido de nuevo'});
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('sends the typed values to the route action', async () => {
        // Expected: the action receives "email" and "password" in the form data (read by their name attribute).
        // The values are captured and checked outside the action: an expect() failing inside it
        // would be caught by React Router and the test would not notice.
        const {action, calls} = recordingAction();
        renderLoginPage({action});

        await fillAndSubmit('apex@example.com', 'secret123');

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(calls[0]).toEqual({email: 'apex@example.com', password: 'secret123'});
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

    it('hides the registration message once the user submits the form', async () => {
        // Expected: the success message disappears and only the error is shown.
        renderLoginPage({
            registeredEmail: 'a***x@example.com',
            action: vi.fn(async () => ({formError: 'Correo o contraseña incorrectos.'}))
        });

        await fillAndSubmit('apex@example.com', 'wrong-pass1');

        await screen.findByRole('alert');
        expect(screen.queryByText(/Cuenta creada/)).not.toBeInTheDocument();
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

    describe('email verification', () => {
        const PENDING = {verification: {status: 'pending', email: 'a***x@example.com'}};

        it('shows the "verify your email" warning with the resend button when the email is not verified', async () => {
            // Expected: the warning naming the masked email and the "Reenviar correo de verificación" button.
            renderLoginPage({action: vi.fn(async () => PENDING)});

            await fillAndSubmit('apex@example.com', 'secret123');

            expect(await screen.findByRole('status')).toHaveTextContent(
                'Verifica tu correo para continuar. Todavía no has abierto el enlace que enviamos a a***x@example.com.'
            );
            expect(screen.getByRole('button', {name: 'Reenviar correo de verificación'})).toBeEnabled();
        });

        it('resends with the typed credentials and the resend intent', async () => {
            // Expected: the second submission carries email, password and intent=resendVerification.
            const {action, calls} = recordingAction(PENDING);
            renderLoginPage({action});

            await fillAndSubmit('apex@example.com', 'secret123');
            await userEvent.click(await screen.findByRole('button', {name: 'Reenviar correo de verificación'}));

            await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
            expect(calls[1]).toEqual({email: 'apex@example.com', password: 'secret123', intent: 'resendVerification'});
        });

        it('still logs in (not resends) when Enter is pressed while the warning is shown', async () => {
            // Expected: the second submission has no "intent" field.
            const {action, calls} = recordingAction(PENDING);
            renderLoginPage({action});

            await fillAndSubmit('apex@example.com', 'secret123');
            await screen.findByRole('button', {name: 'Reenviar correo de verificación'});
            await userEvent.type(screen.getByLabelText('Contraseña'), '{Enter}');

            await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
            expect(calls[1]).not.toHaveProperty('intent');
        });

        it('confirms the resend and blocks the button with a 60 s countdown', async () => {
            // Expected: the "Correo reenviado." message and a disabled "Reenviar en 60 s" button.
            renderLoginPage({
                action: vi.fn(async () => ({verification: {status: 'resent', email: 'a***x@example.com', sentAt: 1}}))
            });

            await fillAndSubmit('apex@example.com', 'secret123');

            expect(await screen.findByRole('status')).toHaveTextContent('Correo reenviado. Revisa tu bandeja de entrada en a***x@example.com');
            expect(screen.getByRole('button', {name: 'Reenviar en 60 s'})).toBeDisabled();
        });

        it('tells the user when the email was already verified', async () => {
            // Expected: "Tu correo ya está verificado. Ya puedes iniciar sesión."
            renderLoginPage({
                action: vi.fn(async () => ({verification: {status: 'alreadyVerified', email: 'a***x@example.com'}}))
            });

            await fillAndSubmit('apex@example.com', 'secret123');

            expect(await screen.findByRole('status')).toHaveTextContent('Tu correo ya está verificado. Ya puedes iniciar sesión.');
        });
    });
});
