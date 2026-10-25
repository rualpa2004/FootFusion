import { CircleAlert, CircleCheck, Mail, MailCheck } from "lucide-react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { ResendVerificationButton } from "../components/auth/ResendVerificationButton";
import { FormAlert } from "../components/form/FormAlert";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { TextInput } from "../components/form/TextInput";
import { RESEND_VERIFICATION_INTENT, type loginAction, type VerificationNotice } from "../router/actions";
import type { loginLoader } from "../router/loaders";

/** Resend cooldown (seconds) after the verification email has been sent again. */
const RESEND_COOLDOWN_SECONDS = 60;

function VerificationAlert({notice, isResending}: {notice: VerificationNotice; isResending: boolean}) {
    if (notice.status === 'alreadyVerified') {
        return (
            <FormAlert variant="success" icon={CircleCheck}>
                <b>Tu correo ya está verificado.</b> Ya puedes iniciar sesión.
            </FormAlert>
        );
    }

    if (notice.status === 'resent') {
        return (
            <FormAlert variant="success" icon={CircleCheck}>
                <b>Correo reenviado.</b> Revisa tu bandeja de entrada en <b>{notice.email}</b> y, cuando lo hayas
                verificado, vuelve a iniciar sesión.
                <div className="mt-2.5 flex">
                    {/* key: every resend mounts a new button, so the countdown starts again from 60. */}
                    <ResendVerificationButton
                        key={notice.sentAt}
                        cooldownSeconds={RESEND_COOLDOWN_SECONDS}
                        isPending={isResending}
                    />
                </div>
            </FormAlert>
        );
    }

    return (
        <FormAlert variant="warning" icon={CircleAlert}>
            <b>Verifica tu correo para continuar.</b> Todavía no has abierto el enlace que enviamos
            a <b>{notice.email}</b>. Revisa también la carpeta de spam.
            <div className="mt-2.5 flex">
                <ResendVerificationButton isPending={isResending}/>
            </div>
        </FormAlert>
    );
}

export function LoginPage() {
    // Errors or the verification notice returned by loginAction (undefined before submitting).
    const actionData = useActionData<typeof loginAction>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    const isResending = isSubmitting && navigation.formData?.get('intent') === RESEND_VERIFICATION_INTENT;
    // Masked email of the account just created, only right after registerAction redirects here
    // (one-time flash message read by loginLoader).
    const {registeredEmail} = useLoaderData<typeof loginLoader>();

    const fieldErrors = actionData?.fieldErrors;

    return (
        <AuthCard title="Bienvenido de nuevo" subtitle="Inicia sesión y prepara tu plantilla para la jornada.">
            <Form method="post" noValidate className="flex flex-col gap-5 short:gap-3">
                {actionData?.formError && <FormAlert variant="error">{actionData.formError}</FormAlert>}
                {actionData?.verification && (
                    <VerificationAlert notice={actionData.verification} isResending={isResending}/>
                )}
                {registeredEmail && !actionData && (
                    <FormAlert variant="success" icon={MailCheck}>
                        <b>Cuenta creada.</b> Te hemos enviado un correo a <b>{registeredEmail}</b> para verificarla.
                        Abre el enlace del correo y después inicia sesión.
                    </FormAlert>
                )}

                <div className="flex flex-col gap-3.5 short:gap-2.5">
                    <FormField label="Correo electrónico" htmlFor="email" error={fieldErrors?.email}>
                        <TextInput
                            id="email"
                            name="email"
                            type="email"
                            icon={Mail}
                            placeholder="tu@ejemplo.com"
                            autoComplete="email"
                            hasError={Boolean(fieldErrors?.email)}
                        />
                    </FormField>
                    <FormField label="Contraseña" htmlFor="password" error={fieldErrors?.password}>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="Introduce tu contraseña"
                            autoComplete="current-password"
                            hasError={Boolean(fieldErrors?.password)}
                        />
                    </FormField>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-text">
                        {/* TODO: sent as 'rememberMe' but not used yet; see the note in loginAction. */}
                        <input type="checkbox" name="rememberMe" className="size-4 accent-primary"/>
                        Recordarme
                    </label>
                    {/* TODO: password recovery. In the future this will call sendPasswordResetEmail(auth, email)
                        from Firebase, probably from a dedicated /forgot-password route with its own action. */}
                    <span className="text-xs font-semibold text-primary">¿Has olvidado tu contraseña?</span>
                </div>

                <SubmitButton
                    label="Iniciar sesión"
                    pendingLabel="Iniciando sesión..."
                    isPending={isSubmitting && !isResending}
                />
            </Form>

            <GoogleSignInButton label="Continuar con Google"/>

            <p className="text-center text-xs leading-[18px] text-muted">
                ¿Nuevo en FootFusion?{' '}
                <Link to="/register" className="font-bold text-primary hover:underline">Crea una cuenta</Link>
            </p>
        </AuthCard>
    );
}
