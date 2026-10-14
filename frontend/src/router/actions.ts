import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { login, register } from "../services/auth.service";
import { setRegisteredFlash } from "./flash-messages";

export interface FormActionResult<Field extends string> {
    fieldErrors?: Partial<Record<Field, string>>;
    formError?: string;
}

export type LoginField = 'email' | 'password';
export type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword' | 'acceptTerms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

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

export async function loginAction({request}: ActionFunctionArgs): Promise<FormActionResult<LoginField> | Response> {
    const formData = await request.formData();
    const email = readText(formData, 'email');
    // Passwords are not trimmed: spaces are valid characters.
    const password = formData.get('password')?.toString() ?? '';

    const fieldErrors: Partial<Record<LoginField, string>> = {};
    if (!email) fieldErrors.email = 'Introduce tu correo electrónico.';
    else if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'El correo no tiene un formato válido.';
    if (!password) fieldErrors.password = 'Introduce tu contraseña.';

    if (hasErrors(fieldErrors)) {
        return {fieldErrors};
    }

    // TODO: "Recordarme" (field 'rememberMe') is not wired yet. In the future, call
    // setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    // before login() so the session only survives the browser tab when it is unchecked.

    try {
        await login(email, password);
    } catch (error) {
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
    if (!name) fieldErrors.name = 'Elige un nombre de mánager.';
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

    // register() signs the user out after creating the profile, so they must log in after the account creation.
    // The confirmation message travels as a one-time flash message (read by loginLoader), not in the URL.
    setRegisteredFlash();
    return redirect('/login');
}
