import { Check, Pencil, Trophy } from "lucide-react";
import { useRef } from "react";
import { useFetcher } from "react-router-dom";
import { LEAGUE_NAME_MAX_LENGTH, LEAGUE_NAME_MIN_LENGTH } from "../../config/league.constants";
import type { renameLeagueAction } from "../../router/league-actions";
import { FormAlert } from "../form/FormAlert";
import { FormField } from "../form/FormField";
import { PRIMARY_BUTTON_CLASSES } from "../form/button-styles";
import { TextInput } from "../form/TextInput";
import { CloseDialogButton, ModalDialog } from "../ModalDialog";

export function RenameLeague({currentName}: Readonly<{currentName: string}>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fetcher = useFetcher<typeof renameLeagueAction>();
    const fieldErrors = fetcher.data?.fieldErrors;

    return (
        <>
            <button
                type="button"
                aria-label="Cambiar nombre"
                title="Cambiar nombre"
                onClick={() => dialogRef.current?.showModal()}
                className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-white transition-colors hover:bg-surface-raised"
            >
                <Pencil className="size-[15px]" aria-hidden/>
            </button>

            <ModalDialog
                ref={dialogRef}
                title="Cambiar el nombre de la liga"
                description={<>Solo puedes cambiarlo <b>una vez</b>. Después, el nombre quedará fijo.</>}
                icon={Pencil}
            >
                <fetcher.Form method="post" noValidate className="flex flex-col gap-4">
                    {fetcher.data?.formError && <FormAlert variant="error">{fetcher.data.formError}</FormAlert>}
                    <FormField
                        label="Nuevo nombre"
                        htmlFor="newLeagueName"
                        error={fieldErrors?.name}
                        hint={`Entre ${LEAGUE_NAME_MIN_LENGTH} y ${LEAGUE_NAME_MAX_LENGTH} caracteres.`}
                    >
                        <TextInput
                            id="newLeagueName"
                            name="name"
                            icon={Trophy}
                            defaultValue={currentName}
                            maxLength={LEAGUE_NAME_MAX_LENGTH}
                            hasError={Boolean(fieldErrors?.name)}
                        />
                    </FormField>
                    <div className="mt-1 flex justify-end gap-2.5">
                        <CloseDialogButton/>
                        <button type="submit" disabled={fetcher.state !== 'idle'} className={PRIMARY_BUTTON_CLASSES}>
                            <Check className="size-4" aria-hidden/>
                            {fetcher.state !== 'idle' ? 'Guardando...' : 'Guardar nombre'}
                        </button>
                    </div>
                </fetcher.Form>
            </ModalDialog>
        </>
    );
}
