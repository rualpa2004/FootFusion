import { Mail, User } from "lucide-react";
import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { FormAlert } from "../components/form/FormAlert";
import { FormField } from "../components/form/FormField";
import { PasswordInput } from "../components/form/PasswordInput";
import { SubmitButton } from "../components/form/SubmitButton";
import { TextInput } from "../components/form/TextInput";
import type { registerAction } from "../router/actions";

export function RegisterPage() {
    const actionData = useActionData<typeof registerAction>();
    const isSubmitting = useNavigation().state === 'submitting';

    const fieldErrors = actionData?.fieldErrors;

    return (
        <AuthCard title="Crea tu cuenta" subtitle="Tu próxima gran temporada empieza aquí.">
            <Form method="post" noValidate className="flex flex-col gap-5 short:gap-3">
                {actionData?.formError && <FormAlert variant="error">{actionData.formError}</FormAlert>}

                <div className="flex flex-col gap-3.5 short:gap-2.5">
                    <FormField label="Nombre de mánager" htmlFor="name" error={fieldErrors?.name}>
                        <TextInput
                            id="name"
                            name="name"
                            type="text"
                            icon={User}
                            placeholder="Elige tu nombre de mánager"
                            autoComplete="nickname"
                            hasError={Boolean(fieldErrors?.name)}
                        />
                    </FormField>
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
                    <FormField
                        label="Contraseña"
                        htmlFor="password"
                        error={fieldErrors?.password}
                        hint="Usa 8 o más caracteres, incluyendo una letra y un número."
                    >
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="Crea una contraseña"
                            autoComplete="new-password"
                            hasError={Boolean(fieldErrors?.password)}
                        />
                    </FormField>
                    <FormField label="Confirmar contraseña" htmlFor="confirmPassword" error={fieldErrors?.confirmPassword}>
                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Vuelve a introducir tu contraseña"
                            autoComplete="new-password"
                            hasError={Boolean(fieldErrors?.confirmPassword)}
                        />
                    </FormField>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-[18px] text-text">
                        <input type="checkbox" name="acceptTerms" className="mt-0.5 size-4 shrink-0 accent-primary"/>
                        <span>
                            {/* TODO: turn these into links to the legal pages once they exist. */}
                            Acepto los <span className="text-primary">Términos del servicio</span> y
                            la <span className="text-primary">Política de privacidad</span>.
                        </span>
                    </label>
                    {fieldErrors?.acceptTerms && (
                        <p className="text-[11px] leading-4 text-danger">{fieldErrors.acceptTerms}</p>
                    )}
                </div>

                <SubmitButton label="Crear cuenta" pendingLabel="Creando cuenta..." isPending={isSubmitting}/>

                <p className="text-center text-xs leading-[18px] text-muted">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-bold text-primary hover:underline">Inicia sesión</Link>
                </p>
            </Form>
        </AuthCard>
    );
}
