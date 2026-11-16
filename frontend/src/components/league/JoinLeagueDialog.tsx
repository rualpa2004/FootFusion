import { KeyRound, LogIn, Shirt } from "lucide-react";
import type { Ref } from "react";
import { Form } from "react-router-dom";
import { JOIN_CODE_LENGTH, TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH } from "../../config/league.constants";
import type { JoinLeagueField } from "../../router/league-actions";
import { FormAlert } from "../form/FormAlert";
import { FormField } from "../form/FormField";
import { PRIMARY_BUTTON_CLASSES } from "../form/button-styles";
import { TextInput } from "../form/TextInput";
import { CloseDialogButton, ModalDialog } from "../ModalDialog";

interface JoinLeagueDialogProps {
    ref: Ref<HTMLDialogElement>;
    defaultCode?: string;
    fieldErrors?: Partial<Record<JoinLeagueField, string>>;
    formError?: string;
    isPending: boolean;
}

export function JoinLeagueDialog({ref, defaultCode, fieldErrors, formError, isPending}: JoinLeagueDialogProps) {
    return (
        <ModalDialog
            ref={ref}
            title="Unirse a una liga"
            description="Introduce el código de 6 caracteres que te ha pasado el propietario de la liga."
            icon={KeyRound}
        >
            <Form method="post" noValidate className="flex flex-col gap-4">
                {formError && <FormAlert variant="error">{formError}</FormAlert>}

                <FormField label="Código de invitación" htmlFor="joinCode" error={fieldErrors?.joinCode}>
                    <TextInput
                        id="joinCode"
                        name="joinCode"
                        icon={KeyRound}
                        defaultValue={defaultCode}
                        maxLength={JOIN_CODE_LENGTH}
                        placeholder="ABC123"
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 bg-transparent font-mono text-base tracking-[.2em] text-white uppercase outline-none placeholder:text-muted"
                        hasError={Boolean(fieldErrors?.joinCode)}
                    />
                </FormField>

                <FormField
                    label="Nombre de tu equipo (opcional)"
                    htmlFor="joinTeamName"
                    error={fieldErrors?.teamName}
                    hint={`Entre ${TEAM_NAME_MIN_LENGTH} y ${TEAM_NAME_MAX_LENGTH} caracteres. Si lo dejas vacío se usará tu nombre de mánager.`}
                >
                    <TextInput
                        id="joinTeamName"
                        name="teamName"
                        icon={Shirt}
                        maxLength={TEAM_NAME_MAX_LENGTH}
                        placeholder="Ej.: Los Galácticos"
                        hasError={Boolean(fieldErrors?.teamName)}
                    />
                </FormField>

                <div className="mt-1 flex justify-end gap-2.5">
                    <CloseDialogButton/>
                    <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASSES}>
                        <LogIn className="size-4" aria-hidden/>
                        {isPending ? 'Uniéndote...' : 'Unirse'}
                    </button>
                </div>
            </Form>
        </ModalDialog>
    );
}