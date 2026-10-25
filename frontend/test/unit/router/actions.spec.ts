import type { ActionFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    CANCEL_SIGN_UP_INTENT,
    completeProfileAction,
    googleSignInAction,
    loginAction,
    logoutAction,
    registerAction,
    RESEND_VERIFICATION_INTENT
} from '../../../src/router/actions';
import { setRegisteredFlash } from '../../../src/router/flash-messages';
import {
    clearGoogleSignUpPending,
    isGoogleSignUpPending,
    markGoogleSignUpPending
} from '../../../src/router/google-sign-up';
import {
    createProfile,
    discardIncompleteAccount,
    EmailNotVerifiedError,
    hasProfile,
    login,
    logout,
    register,
    resendVerificationEmail
} from '../../../src/services/auth.service';

// The actions are tested in isolation: the auth service and the flash message are test doubles.
vi.mock('../../../src/services/auth.service', () => ({
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resendVerificationEmail: vi.fn(),
    hasProfile: vi.fn(),
    createProfile: vi.fn(),
    discardIncompleteAccount: vi.fn(),
    getAuthErrorMessage: (code: string) => `message for ${code}`,
    EmailNotVerifiedError: class extends Error {}
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

    it('blocks the login and returns the verification notice when the email is not verified', async () => {
        // Expected: no redirect, and verification = { status: 'pending', email masked }.
        vi.mocked(login).mockRejectedValue(new EmailNotVerifiedError());

        const result = await loginAction(submit(VALID_LOGIN));

        expect(result).toEqual({verification: {status: 'pending', email: 'a***x@example.com'}});
    });

    describe('when resending the verification email', () => {
        const RESEND = {...VALID_LOGIN, intent: RESEND_VERIFICATION_INTENT};

        it('sends it with the typed credentials and returns the "resent" notice', async () => {
            // Expected: resendVerificationEmail(email, password) called, login() not called, and verification = { status: 'resent', email masked, sentAt: now }.
            vi.mocked(resendVerificationEmail).mockResolvedValue('sent');
            vi.spyOn(Date, 'now').mockReturnValue(1_000);

            const result = await loginAction(submit(RESEND));

            expect(resendVerificationEmail).toHaveBeenCalledWith('apex@example.com', 'secret123');
            expect(login).not.toHaveBeenCalled();
            expect(result).toEqual({verification: {status: 'resent', email: 'a***x@example.com', sentAt: 1_000}});
        });

        it('tells the user when the email is already verified', async () => {
            // Expected: verification = { status: 'alreadyVerified', email masked }.
            vi.mocked(resendVerificationEmail).mockResolvedValue('alreadyVerified');

            const result = await loginAction(submit(RESEND));

            expect(result).toEqual({verification: {status: 'alreadyVerified', email: 'a***x@example.com'}});
        });

        it('returns the error and keeps the "not verified" notice when it fails', async () => {
            // Expected: formError with the service message (e.g. too many attempts) and the pending notice.
            vi.mocked(resendVerificationEmail).mockRejectedValue(new Error('Demasiados intentos. Inténtalo más tarde.'));

            const result = await loginAction(submit(RESEND));

            expect(result).toEqual({
                formError: 'Demasiados intentos. Inténtalo más tarde.',
                verification: {status: 'pending', email: 'a***x@example.com'}
            });
        });

        it('validates the fields before resending', async () => {
            // Expected: fieldErrors.password and the service not called.
            const result = await loginAction(submit({...RESEND, password: ''}));

            expect(result).toEqual({fieldErrors: {password: 'Introduce tu contraseña.'}});
            expect(resendVerificationEmail).not.toHaveBeenCalled();
        });
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
        // "account created" flash message stored with the masked email (never the full one),
        // and a 302 redirect to /login without query parameters.
        const result = await registerAction(submit({...VALID_REGISTER, name: '  ApexManager ', email: ' apex@example.com '}));

        expect(register).toHaveBeenCalledWith('ApexManager', 'apex@example.com', 'secret123');
        expect(setRegisteredFlash).toHaveBeenCalledWith('a***x@example.com');
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

describe('googleSignInAction', () => {
    beforeEach(() => {
        clearGoogleSignUpPending();
        vi.mocked(logout).mockResolvedValue(undefined);
    });

    it('redirects to /home when the Google account already has a profile', async () => {
        // Expected: a 302 redirect to /home and no pending sign-up.
        vi.mocked(hasProfile).mockResolvedValue(true);

        const result = await googleSignInAction(submit({}));

        expectRedirect(result, '/home');
        expect(isGoogleSignUpPending()).toBe(false);
    });

    it('marks the sign-up as pending and redirects to /completar-perfil on a first sign-in', async () => {
        // Expected: the pending mark set (so /completar-perfil can be shown) and a redirect there.
        vi.mocked(hasProfile).mockResolvedValue(false);

        const result = await googleSignInAction(submit({}));

        expectRedirect(result, '/completar-perfil');
        expect(isGoogleSignUpPending()).toBe(true);
    });

    it('signs out and returns the error when the profile cannot be checked', async () => {
        // Expected: logout() called and formError with the service message.
        vi.mocked(hasProfile).mockRejectedValue(new Error('Ha ocurrido un error inesperado.'));

        const result = await googleSignInAction(submit({}));

        expect(logout).toHaveBeenCalledTimes(1);
        expect(result).toEqual({formError: 'Ha ocurrido un error inesperado.'});
    });

    it('translates the error of the Google window sent by the button', async () => {
        // Expected: formError from getAuthErrorMessage(code) and the API is not called.
        const result = await googleSignInAction(submit({popupErrorCode: 'auth/popup-blocked'}));

        expect(result).toEqual({formError: 'message for auth/popup-blocked'});
        expect(hasProfile).not.toHaveBeenCalled();
    });
});

describe('completeProfileAction', () => {
    beforeEach(() => {
        markGoogleSignUpPending();
        vi.mocked(discardIncompleteAccount).mockResolvedValue(undefined);
    });

    it('requires the manager name', async () => {
        // Expected: fieldErrors.name and createProfile() not called.
        const result = await completeProfileAction(submit({name: '   '}));

        expect(result).toEqual({fieldErrors: {name: 'Elige un nombre de mánager.'}});
        expect(createProfile).not.toHaveBeenCalled();
    });

    it('creates the profile with the trimmed name and redirects to /home', async () => {
        // Expected: createProfile("ApexManager"), the pending mark cleared and a redirect to /home.
        vi.mocked(createProfile).mockResolvedValue({
            id: 1, name: 'ApexManager', email: 'apex@gmail.com', role: 'USER', registerDate: '2026-10-20'
        });

        const result = await completeProfileAction(submit({name: ' ApexManager '}));

        expect(createProfile).toHaveBeenCalledWith('ApexManager');
        expect(isGoogleSignUpPending()).toBe(false);
        expectRedirect(result, '/home');
    });

    it('returns the service error and keeps the sign-up pending', async () => {
        // Expected: formError with the message, and still pending so the user can try again.
        vi.mocked(createProfile).mockRejectedValue(new Error('Ha ocurrido un error inesperado.'));

        const result = await completeProfileAction(submit({name: 'ApexManager'}));

        expect(result).toEqual({formError: 'Ha ocurrido un error inesperado.'});
        expect(isGoogleSignUpPending()).toBe(true);
    });

    it('deletes the account and goes back to /login with "Usar otra cuenta"', async () => {
        // Expected: the incomplete account discarded, no profile created, the mark cleared and a redirect to /login.
        const result = await completeProfileAction(submit({intent: CANCEL_SIGN_UP_INTENT}));

        expect(discardIncompleteAccount).toHaveBeenCalledTimes(1);
        expect(createProfile).not.toHaveBeenCalled();
        expect(isGoogleSignUpPending()).toBe(false);
        expectRedirect(result, '/login');
    });
});

describe('logoutAction', () => {
    it('signs out and redirects to /login', async () => {
        // Expected: logout() called and a 302 redirect to /login (without any message).
        vi.mocked(logout).mockResolvedValue(undefined);

        const result = await logoutAction();

        expect(logout).toHaveBeenCalledTimes(1);
        expectRedirect(result, '/login');
    });
});
