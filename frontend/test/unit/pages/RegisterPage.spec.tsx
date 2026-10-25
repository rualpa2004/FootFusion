import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '../../../src/pages/RegisterPage';
import { renderWithRouter } from '../../helpers/render-with-router';

vi.mock('../../../src/services/auth.service', () => ({
    signInWithGoogle: vi.fn()
}));

/** The <details> element that folds the email form. */
function getEmailFormToggle() {
    return screen.getByText('Registrarse con correo').closest('details')!;
}

function renderRegisterPage(action: ActionFunction = vi.fn(async () => null)) {
    renderWithRouter({path: '/register', element: <RegisterPage/>, action});
    return {action};
}

async function fillForm({acceptTerms = true} = {}) {
    // The email form starts folded: unfold it first, as the user would.
    await userEvent.click(await screen.findByText('Registrarse con correo'));
    await userEvent.type(screen.getByLabelText('Nombre de mánager'), 'ApexManager');
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'apex@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'secret123');
    if (acceptTerms) {
        await userEvent.click(screen.getByRole('checkbox'));
    }
}

async function submitForm() {
    await userEvent.click(screen.getByRole('button', {name: 'Crear cuenta'}));
}

describe('RegisterPage', () => {
    it('renders the registration form', async () => {
        // Expected: title, the four fields, the terms checkbox, the submit button and the login link.
        renderRegisterPage();

        expect(await screen.findByRole('heading', {name: 'Crea tu cuenta'})).toBeInTheDocument();
        expect(screen.getByLabelText('Nombre de mánager')).toBeInTheDocument();
        expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'password');
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.getByRole('button', {name: 'Crear cuenta'})).toBeEnabled();
    });

    it('starts with the email form folded and Google offered below', async () => {
        // Expected: the <details> closed, and the "o por Google" separator with "Registrarse con Google".
        renderRegisterPage();

        await screen.findByRole('heading', {name: 'Crea tu cuenta'});
        expect(getEmailFormToggle()).not.toHaveAttribute('open');
        expect(screen.getByText('o por Google')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Registrarse con Google'})).toBeInTheDocument();
    });

    it('unfolds the email form when "Registrarse con correo" is clicked', async () => {
        // Expected: the <details> open after the click, and closed again after a second click.
        renderRegisterPage();

        await userEvent.click(await screen.findByText('Registrarse con correo'));
        expect(getEmailFormToggle()).toHaveAttribute('open');

        await userEvent.click(screen.getByText('Registrarse con correo'));
        expect(getEmailFormToggle()).not.toHaveAttribute('open');
    });

    it('links to the login page', async () => {
        // Expected: it points to /login.
        renderRegisterPage();

        expect(await screen.findByRole('link', {name: 'Inicia sesión'})).toHaveAttribute('href', '/login');
    });

    it('shows the password hint before any error', async () => {
        // Expected: "Usa 8 o más caracteres, incluyendo una letra y un número." is visible.
        renderRegisterPage();

        expect(await screen.findByText('Usa 8 o más caracteres, incluyendo una letra y un número.')).toBeInTheDocument();
    });

    it('sends every field to the route action', async () => {
        // Expected: the action receives name, email, password, confirmPassword and acceptTerms="on".
        // The values are captured and checked outside the action: an expect() failing inside it
        // would be caught by React Router and the test would not notice.
        let sentData: Record<string, FormDataEntryValue> = {};
        const action = vi.fn(async ({request}: {request: Request}) => {
            sentData = Object.fromEntries(await request.formData());
            return null;
        });
        renderRegisterPage(action);

        await fillForm();
        await submitForm();

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(sentData).toEqual({
            name: 'ApexManager',
            email: 'apex@example.com',
            password: 'secret123',
            confirmPassword: 'secret123',
            acceptTerms: 'on'
        });
    });

    it('does not send acceptTerms when the checkbox is not checked', async () => {
        // Expected: the form data has no "acceptTerms" field (the action uses this to show its error).
        let sentData: Record<string, FormDataEntryValue> = {};
        const action = vi.fn(async ({request}: {request: Request}) => {
            sentData = Object.fromEntries(await request.formData());
            return null;
        });
        renderRegisterPage(action);

        await fillForm({acceptTerms: false});
        await submitForm();

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(sentData).not.toHaveProperty('acceptTerms');
    });

    it('shows the field errors returned by the action', async () => {
        // Expected: each message is shown, the password error replaces the hint and the inputs are marked invalid.
        renderRegisterPage(vi.fn(async () => ({
            fieldErrors: {
                name: 'Elige un nombre de mánager.',
                password: 'La contraseña debe tener 8 o más caracteres, con al menos una letra y un número.',
                confirmPassword: 'Las contraseñas no coinciden.',
                acceptTerms: 'Debes aceptar los términos y la política de privacidad.'
            }
        })));

        await fillForm({acceptTerms: false});
        await submitForm();

        expect(await screen.findByText('Elige un nombre de mánager.')).toBeInTheDocument();
        expect(screen.getByText('La contraseña debe tener 8 o más caracteres, con al menos una letra y un número.')).toBeInTheDocument();
        expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
        expect(screen.getByText('Debes aceptar los términos y la política de privacidad.')).toBeInTheDocument();
        expect(screen.queryByText('Usa 8 o más caracteres, incluyendo una letra y un número.')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Nombre de mánager')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'false');
        // The form is rendered unfolded so the errors are visible.
        expect(getEmailFormToggle()).toHaveAttribute('open');
    });

    it('shows the form error returned by the action', async () => {
        // Expected: an alert with the message.
        renderRegisterPage(vi.fn(async () => ({formError: 'Este correo ya está registrado.'})));

        await fillForm();
        await submitForm();

        expect(await screen.findByRole('alert')).toHaveTextContent('Este correo ya está registrado.');
    });

    it('disables the button and shows the pending label while submitting', async () => {
        // Expected: "Creando cuenta..." and disabled; back to "Crear cuenta" when the action finishes.
        let finishAction: (value: null) => void = () => {};
        renderRegisterPage(vi.fn(() => new Promise<null>((resolve) => { finishAction = resolve; })));

        await fillForm();
        await submitForm();

        const pendingButton = await screen.findByRole('button', {name: 'Creando cuenta...'});
        expect(pendingButton).toBeDisabled();

        finishAction(null);
        expect(await screen.findByRole('button', {name: 'Crear cuenta'})).toBeEnabled();
    });
});
