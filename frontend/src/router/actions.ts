import { redirect, type ActionFunctionArgs } from "react-router-dom";
import {
    createProfile,
    discardIncompleteAccount,
    EmailNotVerifiedError,
    getAuthErrorMessage,
    hasProfile,
    login,
    logout,
    register,
    resendVerificationEmail
} from "../services/auth.service";
import { maskEmail } from "../utils/format";
import { setRegisteredFlash } from "./flash-messages";
import { clearGoogleSignUpPending, markGoogleSignUpPending } from "./google-sign-up";

export interface FormActionResult<Field extends string> {
    fieldErrors?: Partial<Record<Field, string>>;
    formError?: string;
}

export type LoginField = 'email' | 'password';
export type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword' | 'acceptTerms';
export type CompleteProfileField = 'name';

export interface VerificationNotice {
    status: 'pending' | 'resent' | 'alreadyVerified';
    email: string;
    sentAt?: number;
}

export interface LoginActionResult extends FormActionResult<LoginField> {
    verification?: VerificationNotice;
}

export const RESEND_VERIFICATION_INTENT = 'resendVerification';
export const CANCEL_SIGN_UP_INTENT = 'cancelSignUp';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const MANAGER_NAME_REQUIRED = 'Elige un nombre de mánager.';

function readText(formData: FormData, field: string): string {
    const value = formData.get(field);
    return typeof value === 'string' ? value.trim() : '';
}

function hasErrors(errors: object): boolean {
    return Object.keys(errors).length > 0;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.';
}

export async function loginAction({request}: ActionFunctionArgs): Promise<LoginActionResult | Response> {
    const formData = await request.formData();
    const email = readText(formData, 'email');
    // Passwords are not trimmed: spaces are valid characters.
    const password = formData.get('password')?.toString() ?? '';
    const isResend = formData.get('intent') === RESEND_VERIFICATION_INTENT;

    const fieldErrors: Partial<Record<LoginField, string>> = {};
    if (!email) fieldErrors.email = 'Introduce tu correo electrónico.';
    else if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'El correo no tiene un formato válido.';
    if (!password) fieldErrors.password = 'Introduce tu contraseña.';

    if (hasErrors(fieldErrors)) {
        return {fieldErrors};
    }

    if (isResend) {
        try {
            const result = await resendVerificationEmail(email, password);
            return result === 'sent'
                ? {verification: {status: 'resent', email: maskEmail(email), sentAt: Date.now()}}
                : {verification: {status: 'alreadyVerified', email: maskEmail(email)}};
        } catch (error) {
            return {formError: getErrorMessage(error), verification: {status: 'pending', email: maskEmail(email)}};
        }
    }

    // TODO: "Recordarme" (field 'rememberMe') is not wired yet. In the future, call
    // setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    // before login() so the session only survives the browser tab when it is unchecked.

    try {
        await login(email, password);
    } catch (error) {
        if (error instanceof EmailNotVerifiedError) {
            return {verification: {status: 'pending', email: maskEmail(email)}};
        }
        return {formError: getErrorMessage(error)};
    }

    return redirect('/home');
}

export async function registerAction({request}: ActionFunctionArgs): Promise<FormActionResult<RegisterField> | Response> {
    const formData = await request.formData();
    const name = readText(formData, 'name');
    const email = readText(formData, 'email');
    const password = formData.get('password')?.toString() ?? '';
    const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';
    const acceptTerms = formData.get('acceptTerms') === 'on';

    const fieldErrors: Partial<Record<RegisterField, string>> = {};
    if (!name) fieldErrors.name = MANAGER_NAME_REQUIRED;
    if (!email) fieldErrors.email = 'Introduce tu correo electrónico.';
    else if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'El correo no tiene un formato válido.';
    if (password.length < PASSWORD_MIN_LENGTH || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        fieldErrors.password = 'La contraseña debe tener 8 o más caracteres, con al menos una letra y un número.';
    }
    if (confirmPassword !== password) fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
    if (!acceptTerms) fieldErrors.acceptTerms = 'Debes aceptar los términos y la política de privacidad.';

    if (hasErrors(fieldErrors)) {
        return {fieldErrors};
    }

    try {
        await register(name, email, password);
    } catch (error) {
        return {formError: getErrorMessage(error)};
    }

    // register() signs the user out and sends the verification email, so they must verify it and log in.
    // The message (with the masked email) travels as a one-time flash message.
    setRegisteredFlash(maskEmail(email));
    return redirect('/login');
}

export async function googleSignInAction({request}: ActionFunctionArgs): Promise<FormActionResult<never> | Response> {
    const formData = await request.formData();
    const popupErrorCode = readText(formData, 'popupErrorCode');

    if (popupErrorCode) {
        return {formError: getAuthErrorMessage(popupErrorCode)};
    }

    let profileExists: boolean;
    try {
        profileExists = await hasProfile();
    } catch (error) {
        await logout();
        return {formError: getErrorMessage(error)};
    }

    if (profileExists) {
        return redirect('/home');
    }
    markGoogleSignUpPending();
    return redirect('/completar-perfil');
}

export async function completeProfileAction({request}: ActionFunctionArgs): Promise<FormActionResult<CompleteProfileField> | Response> {
    const formData = await request.formData();

    if (formData.get('intent') === CANCEL_SIGN_UP_INTENT) {
        // "Usar otra cuenta": the Firebase account just created by Google is deleted.
        clearGoogleSignUpPending();
        await discardIncompleteAccount();
        return redirect('/login');
    }

    const name = readText(formData, 'name');
    if (!name) {
        return {fieldErrors: {name: MANAGER_NAME_REQUIRED}};
    }

    try {
        await createProfile(name);
    } catch (error) {
        return {formError: getErrorMessage(error)};
    }

    clearGoogleSignUpPending();
    return redirect('/home');
}

export async function logoutAction(): Promise<Response> {
    await logout();
    return redirect('/login');
}
