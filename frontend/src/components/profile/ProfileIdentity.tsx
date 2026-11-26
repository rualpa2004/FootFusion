import { Calendar, Check, CircleCheck, Mail, Pencil, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { MANAGER_NAME_HINT, MANAGER_NAME_MAX_LENGTH } from "../../config/user.constants";
import { RENAME_INTENT, type ProfileActionResult, type profileAction } from "../../router/profile-actions";
import type { UserProfile } from "../../services/auth.service";
import { formatMonthYear } from "../../utils/format";
import { FormAlert } from "../form/FormAlert";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "../form/button-styles";
import { TextInput } from "../form/TextInput";
import { UserAvatar } from "../UserAvatar";

/** Time the "Nombre actualizado" notice stays on screen. */
export const NAME_UPDATED_NOTICE_MS = 4000;

/** Avatar, manager name (editable in place), email and sign-up date of the user. */
export function ProfileIdentity({profile}: Readonly<{profile: UserProfile}>) {
    const fetcher = useFetcher<typeof profileAction>();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(profile.name);
    // Result of the last save. It is kept apart from fetcher.data so that opening the editor again clears it.
    const [result, setResult] = useState<ProfileActionResult | undefined>();
    const [handledData, setHandledData] = useState(fetcher.data);

    // A new answer of the action (state adjusted while rendering, without an effect): a saved name closes the editor
    if (fetcher.data !== handledData) {
        setHandledData(fetcher.data);
        setResult(fetcher.data);
        if (fetcher.data?.nameUpdated) setIsEditing(false);
    }

    // The success notice hides itself after a few seconds; an error stays until the user edits again
    const nameUpdated = result?.nameUpdated === true;
    useEffect(() => {
        if (!nameUpdated) {
            return;
        }
        const timer = window.setTimeout(() => setResult(undefined), NAME_UPDATED_NOTICE_MS);
        return () => window.clearTimeout(timer);
    }, [nameUpdated]);

    const isSaving = fetcher.state !== 'idle';
    // While the name is saved and the profile reloaded, the new name is shown already
    const submittedName = fetcher.formData?.get('name');
    const shownName = isSaving && typeof submittedName === 'string' ? submittedName.trim() : profile.name;
    const nameError = result?.fieldErrors?.name;

    const startEditing = () => {
        setName(profile.name);
        setResult(undefined);
        setIsEditing(true);
    };
    const cancelEditing = () => {
        setResult(undefined);
        setIsEditing(false);
    };

    return (
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
            <UserAvatar name={shownName} photoUrl={profile.profilePhoto} className="size-16 sm:size-20"/>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
                {isEditing ? (
                    <fetcher.Form method="post" noValidate className="flex max-w-[420px] flex-col gap-2">
                        <input type="hidden" name="intent" value={RENAME_INTENT}/>
                        <div className="flex justify-between text-xs text-muted">
                            <label htmlFor="managerName">Nombre de mánager</label>
                            <span aria-hidden>{name.length} / {MANAGER_NAME_MAX_LENGTH}</span>
                        </div>
                        <TextInput
                            id="managerName"
                            name="name"
                            icon={User}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            onKeyDown={(event) => event.key === 'Escape' && cancelEditing()}
                            maxLength={MANAGER_NAME_MAX_LENGTH}
                            autoComplete="nickname"
                            autoFocus
                            hasError={Boolean(nameError)}
                        />
                        <p id="managerName-message" className={`text-[11px] leading-4 ${nameError ? 'text-danger' : 'text-muted'}`}>
                            {nameError ?? MANAGER_NAME_HINT}
                        </p>
                        {result?.formError && <FormAlert variant="error">{result.formError}</FormAlert>}
                        <div className="flex gap-2.5">
                            <button type="submit" disabled={isSaving} className={PRIMARY_BUTTON_CLASSES}>
                                <Check className="size-4" aria-hidden/>{isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" onClick={cancelEditing} className={SECONDARY_BUTTON_CLASSES}>Cancelar</button>
                        </div>
                    </fetcher.Form>
                ) : (
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="min-w-0 font-display text-2xl font-extrabold break-words text-white">{shownName}</h2>
                        <button type="button" onClick={startEditing} className={`${SECONDARY_BUTTON_CLASSES} h-8 text-xs`}>
                            <Pencil className="size-3.5" aria-hidden/>Editar nombre
                        </button>
                    </div>
                )}

                {!isEditing && nameUpdated && (
                    <FormAlert variant="success" icon={CircleCheck}>
                        Nombre actualizado. Lo verán el resto de miembros de tus ligas.
                    </FormAlert>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                    <span className="flex min-w-0 items-center gap-1.5">
                        <Mail className="size-4 shrink-0" aria-hidden/><span className="truncate">{profile.email}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="size-4 shrink-0" aria-hidden/>En FootFusion desde {formatMonthYear(profile.registerDate)}
                    </span>
                </div>
            </div>
        </section>
    );
}
