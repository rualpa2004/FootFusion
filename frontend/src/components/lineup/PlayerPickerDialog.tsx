import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TeamPlayer } from "../../services/team.service";
import { formatMillions } from "../../utils/format";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "../form/button-styles";
import { ModalDialog } from "../ModalDialog";
import { POSITION_COLORS, UNKNOWN_POSITION_COLORS } from "../position-styles";

export interface PickerOption {
    player: TeamPlayer;
    where: string;
}

interface PlayerPickerDialogProps {
    title: string;
    description: string;
    options: PickerOption[];
    initialPlayerId: number | null;    // Player selected when the dialog opens.
    confirmLabel: string;
    /** Shows "Dejar vacío", which empties the slot. */
    allowEmpty?: boolean;
    onConfirm: (playerId: number | null) => void;
    onClose: () => void;
}

export function PlayerPickerDialog({
    title, description, options, initialPlayerId, confirmLabel, allowEmpty = false, onConfirm, onClose
}: Readonly<PlayerPickerDialogProps>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [selectedId, setSelectedId] = useState(initialPlayerId ?? options[0]?.player.playerPropertyId ?? null);

    // useEffect: <dialog> can only be opened as a modal from the DOM element once it is rendered
    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const choose = (playerId: number | null) => {
        onConfirm(playerId);
        dialogRef.current?.close();
    };

    return (
        <ModalDialog ref={dialogRef} title={title} description={description} onClose={onClose}>
            {options.length === 0 ? (
                <p className="text-[13px] text-muted">No tienes jugadores de esta posición en tu plantilla.</p>
            ) : (
                <fieldset className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto">
                    <legend className="sr-only">{title}</legend>
                    {options.map(({player, where}) => (
                        <label
                            key={player.playerPropertyId}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-background px-3 py-2 has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-primary"
                        >
                            <input
                                type="radio"
                                name="picker-player"
                                value={player.playerPropertyId}
                                checked={selectedId === player.playerPropertyId}
                                onChange={() => setSelectedId(player.playerPropertyId)}
                                className="sr-only"
                            />
                            <span className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${
                                player.positionGroup ? POSITION_COLORS[player.positionGroup] : UNKNOWN_POSITION_COLORS
                            }`}>
                                {player.photo
                                    ? <img src={player.photo} alt="" className="size-full object-cover"/>
                                    : <UserRound className="size-5" aria-hidden/>}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <b className="truncate text-[13px] text-white">{player.name}</b>
                                <span className="truncate text-[11px] text-muted">
                                    {player.teamName ? `${player.teamName} · ` : ''}{formatMillions(player.marketValue)}
                                </span>
                            </span>
                            <span className="text-[10px] font-bold text-subtle">{where}</span>
                        </label>
                    ))}
                </fieldset>
            )}
            <div className="mt-1 flex justify-end gap-2.5">
                {allowEmpty
                    ? <button type="button" onClick={() => choose(null)} className={SECONDARY_BUTTON_CLASSES}>Dejar vacío</button>
                    : <button type="button" onClick={() => dialogRef.current?.close()} className={SECONDARY_BUTTON_CLASSES}>Cancelar</button>}
                <button
                    type="button"
                    disabled={selectedId === null}
                    onClick={() => choose(selectedId)}
                    className={PRIMARY_BUTTON_CLASSES}
                >
                    {confirmLabel}
                </button>
            </div>
        </ModalDialog>
    );
}
