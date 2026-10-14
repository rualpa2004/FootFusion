import { Mail } from "lucide-react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { FormAlert } from "../components/form/FormAlert";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { TextInput } from "../components/form/TextInput";
import type { loginAction } from "../router/actions";
import type { loginLoader } from "../router/loaders";

export function LoginPage() {
    // Errors returned by loginAction after a failed submission (undefined before submitting).
    const actionData = useActionData<typeof loginAction>();
    const isSubmitting = useNavigation().state === 'submitting';
    // True only right after registerAction redirects here (one-time flash message read by loginLoader).
    const {justRegistered} = useLoaderData<typeof loginLoader>();

    const fieldErrors = actionData?.fieldErrors;

    return (
        <AuthCard title="Bienvenido de nuevo" subtitle="Inicia sesión y prepara tu plantilla para la jornada.">
            <Form method="post" noValidate className="flex flex-col gap-5 short:gap-3">
                {actionData?.formError && <FormAlert variant="error">{actionData.formError}</FormAlert>}
                {justRegistered && !actionData && (
                    <FormAlert variant="success">Cuenta creada correctamente. Ya puedes iniciar sesión.</FormAlert>
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

                <SubmitButton label="Iniciar sesión" pendingLabel="Iniciando sesión..." isPending={isSubmitting}/>

                <p className="text-center text-xs leading-[18px] text-muted">
                    ¿Nuevo en FootFusion?{' '}
                    <Link to="/register" className="font-bold text-primary hover:underline">Crea una cuenta</Link>
                </p>
            </Form>
        </AuthCard>
    );
}
