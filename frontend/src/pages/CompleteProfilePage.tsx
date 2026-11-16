import { User } from "lucide-react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { LegalNotice } from "../components/auth/LegalNotice";
import { FormAlert } from "../components/form/FormAlert";
import { FormField } from "../components/form/FormField";
import { SubmitButton } from "../components/form/SubmitButton";
import { TextInput } from "../components/form/TextInput";
import { UserAvatar } from "../components/UserAvatar";
import { CANCEL_SIGN_UP_INTENT, type completeProfileAction } from "../router/actions";
import type { completeProfileLoader } from "../router/loaders";

/**
 * Until "Empezar a jugar" succeeds there is no FootFusion profile; leaving the page deletes the account.
 */
export function CompleteProfilePage() {
    const {email, photoUrl} = useLoaderData<typeof completeProfileLoader>();
    const actionData = useActionData<typeof completeProfileAction>();
    const navigation = useNavigation();
    const submittingIntent = navigation.state === 'submitting' ? navigation.formData?.get('intent') : null;
    const isCancelling = submittingIntent === CANCEL_SIGN_UP_INTENT;
    const isCreating = navigation.state === 'submitting' && !isCancelling;

    const fieldErrors = actionData?.fieldErrors;

    return (
        <AuthCard title="Un último paso" subtitle="Elige el nombre con el que te verán tus rivales en las ligas.">
            <div className="flex items-center gap-3 rounded-[10px] border border-line bg-background p-3">
                <div className="relative shrink-0">
                    <UserAvatar name="Foto de tu cuenta de Google" photoUrl={photoUrl} className="size-10"/>
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-white">
                        <GoogleIcon className="size-2.5"/>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px] font-semibold text-white">Cuenta de Google</span>
                    <span className="truncate text-xs text-muted">{email}</span>
                </div>
                <Form method="post">
                    <button
                        type="submit"
                        name="intent"
                        value={CANCEL_SIGN_UP_INTENT}
                        disabled={navigation.state === 'submitting'}
                        className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isCancelling ? 'Saliendo...' : 'Usar otra cuenta'}
                    </button>
                </Form>
            </div>

            <Form method="post" noValidate className="flex flex-col gap-5 short:gap-3">
                {actionData?.formError && <FormAlert variant="error">{actionData.formError}</FormAlert>}

                <FormField
                    label="Nombre de mánager"
                    htmlFor="name"
                    error={fieldErrors?.name}
                    hint="Podrás cambiarlo más adelante desde tu perfil."
                >
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

                <LegalNotice prefix="Al continuar aceptas"/>

                <SubmitButton label="Empezar a jugar" pendingLabel="Creando perfil..." isPending={isCreating}/>
            </Form>
        </AuthCard>
    );
}
