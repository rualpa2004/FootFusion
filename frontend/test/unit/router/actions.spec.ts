import type { ActionFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginAction, registerAction } from '../../../src/router/actions';
import { setRegisteredFlash } from '../../../src/router/flash-messages';
import { login, register } from '../../../src/services/auth.service';

// The actions are tested in isolation: the auth service and the flash message are test doubles.
vi.mock('../../../src/services/auth.service', () => ({
    login: vi.fn(),
    register: vi.fn()
}));
vi.mock('../../../src/router/flash-messages', () => ({
    setRegisteredFlash: vi.fn()
}));

/** Builds the arguments React Router passes to an action when a form is submitted with these fields. */
function submit(fields: Record<string, string>): ActionFunctionArgs {
    const request = new Request('http://localhost/form', {
        method: 'POST',
        body: new URLSearchParams(fields)
    });
    return {request, params: {}, context: {}} as ActionFunctionArgs;
}

/** Narrows an action result to a redirect Response. */
function expectRedirect(result: unknown, location: string) {
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(location);
}

const VALID_LOGIN = {email: 'apex@example.com', password: 'secret123'};
const VALID_REGISTER = {
    name: 'ApexManager',
    email: 'apex@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    acceptTerms: 'on'
};

describe('loginAction', () => {
    beforeEach(() => {
        vi.mocked(login).mockResolvedValue({
            id: 1, name: 'ApexManager', email: 'apex@example.com', role: 'USER', registerDate: '2026-10-09'
        });
    });

    it('requires the email', async () => {
        // Expected: fieldErrors.email = "Introduce tu correo electrónico." and login() not called.
        const result = await loginAction(submit({...VALID_LOGIN, email: ''}));

        expect(result).toEqual({fieldErrors: {email: 'Introduce tu correo electrónico.'}});
        expect(login).not.toHaveBeenCalled();
    });

    it('rejects a badly formatted email', async () => {
        // Expected: fieldErrors.email = "El correo no tiene un formato válido."
        const result = await loginAction(submit({...VALID_LOGIN, email: 'apex@'}));

        expect(result).toEqual({fieldErrors: {email: 'El correo no tiene un formato válido.'}});
    });

    it('requires the password', async () => {
        // Expected: fieldErrors.password = "Introduce tu contraseña."
        const result = await loginAction(submit({...VALID_LOGIN, password: ''}));

        expect(result).toEqual({fieldErrors: {password: 'Introduce tu contraseña.'}});
    });

    it('returns every field error at once', async () => {
        // Expected: both the email and the password errors in the same response.
        const result = await loginAction(submit({email: '', password: ''}));

        expect(result).toEqual({
            fieldErrors: {email: 'Introduce tu correo electrónico.', password: 'Introduce tu contraseña.'}
        });
    });

    it('logs in and redirects to /home with valid data', async () => {
        // Expected: login(email, password) called and a 302 redirect to /home.
        const result = await loginAction(submit(VALID_LOGIN));

        expect(login).toHaveBeenCalledWith('apex@example.com', 'secret123');
        expectRedirect(result, '/home');
    });

    it('trims the email but keeps the password exactly as typed', async () => {
        // Expected: the email without spaces and the password untouched (spaces are valid in passwords).
        await loginAction(submit({email: '  apex@example.com  ', password: ' secret123 '}));

        expect(login).toHaveBeenCalledWith('apex@example.com', ' secret123 ');
    });

    it('returns the service error as a form error', async () => {
        // Expected: formError with the service message and no redirect.
        vi.mocked(login).mockRejectedValue(new Error('Correo o contraseña incorrectos.'));

        const result = await loginAction(submit(VALID_LOGIN));

        expect(result).toEqual({formError: 'Correo o contraseña incorrectos.'});
    });

    it('uses a generic message when the failure is not an Error', async () => {
        // Expected: formError = "Ha ocurrido un error inesperado."
        vi.mocked(login).mockRejectedValue('unexpected');

        const result = await loginAction(submit(VALID_LOGIN));

        expect(result).toEqual({formError: 'Ha ocurrido un error inesperado.'});
    });
});

describe('registerAction', () => {
    beforeEach(() => {
        vi.mocked(register).mockResolvedValue(undefined);
    });

    it('requires the manager name', async () => {
        // Expected: fieldErrors.name = "Elige un nombre de mánager." and register() not called.
        const result = await registerAction(submit({...VALID_REGISTER, name: '   '}));

        expect(result).toEqual({fieldErrors: {name: 'Elige un nombre de mánager.'}});
        expect(register).not.toHaveBeenCalled();
    });

    it('requires the email', async () => {
        // Expected: fieldErrors.email = "Introduce tu correo electrónico."
        const result = await registerAction(submit({...VALID_REGISTER, email: ''}));

        expect(result).toEqual({fieldErrors: {email: 'Introduce tu correo electrónico.'}});
    });

    it('rejects a badly formatted email', async () => {
        // Expected: fieldErrors.email = "El correo no tiene un formato válido."
        const result = await registerAction(submit({...VALID_REGISTER, email: 'apex.example.com'}));

        expect(result).toEqual({fieldErrors: {email: 'El correo no tiene un formato válido.'}});
    });

    it.each([
        ['shorter than 8 characters', 'abc123'],
        ['without numbers', 'onlyletters'],
        ['without letters', '12345678']
    ])('rejects a password %s', async (_case, password) => {
        // Expected: the password rule message in fieldErrors.password.
        const result = await registerAction(submit({...VALID_REGISTER, password, confirmPassword: password}));

        expect(result).toEqual({
            fieldErrors: {password: 'La contraseña debe tener 8 o más caracteres, con al menos una letra y un número.'}
        });
    });

    it('rejects a confirmation that does not match the password', async () => {
        // Expected: fieldErrors.confirmPassword = "Las contraseñas no coinciden."
        const result = await registerAction(submit({...VALID_REGISTER, confirmPassword: 'secret124'}));

        expect(result).toEqual({fieldErrors: {confirmPassword: 'Las contraseñas no coinciden.'}});
    });

    it('requires accepting the terms', async () => {
        // Expected: fieldErrors.acceptTerms = "Debes aceptar los términos y la política de privacidad."
        const {acceptTerms: _omitted, ...withoutTerms} = VALID_REGISTER;

        const result = await registerAction(submit(withoutTerms));

        expect(result).toEqual({fieldErrors: {acceptTerms: 'Debes aceptar los términos y la política de privacidad.'}});
    });

    it('returns every field error at once', async () => {
        // Expected: errors for name, email, password and terms together (confirmation matches: both empty).
        const result = await registerAction(submit({name: '', email: '', password: '', confirmPassword: ''}));

        expect(result).toEqual({
            fieldErrors: {
                name: 'Elige un nombre de mánager.',
                email: 'Introduce tu correo electrónico.',
                password: 'La contraseña debe tener 8 o más caracteres, con al menos una letra y un número.',
                acceptTerms: 'Debes aceptar los términos y la política de privacidad.'
            }
        });
    });

    it('registers, stores the flash message and redirects to /login with valid data', async () => {
        // Expected: register(name, email, password) called with trimmed name/email, the one-time
        // "account created" flash message stored, and a 302 redirect to /login without query parameters.
        const result = await registerAction(submit({...VALID_REGISTER, name: '  ApexManager ', email: ' apex@example.com '}));

        expect(register).toHaveBeenCalledWith('ApexManager', 'apex@example.com', 'secret123');
        expect(setRegisteredFlash).toHaveBeenCalledTimes(1);
        expectRedirect(result, '/login');
    });

    it('returns the service error as a form error and does not store the flash message', async () => {
        // Expected: formError with the service message, no flash message and no redirect.
        vi.mocked(register).mockRejectedValue(new Error('Este correo ya está registrado.'));

        const result = await registerAction(submit(VALID_REGISTER));

        expect(result).toEqual({formError: 'Este correo ya está registrado.'});
        expect(setRegisteredFlash).not.toHaveBeenCalled();
    });
});
