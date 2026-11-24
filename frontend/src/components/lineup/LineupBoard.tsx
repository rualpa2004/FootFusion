import { Check, Clock, Crown, Lock, Repeat, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { PositionGroup } from "../../config/league.constants";
import { LINEUP_SIZE, type Formation } from "../../config/lineup.constants";
import type { Lineup, TeamDetail, TeamPlayer } from "../../services/team.service";
import { formatMatchdayTime } from "../../utils/format";
import {
    assignPlayer,
    changeFormation,
    clearSlot,
    draftFromLineup,
    firstEmptySlot,
    isComplete,
    positionSlots,
    sameDraft,
    slotPosition,
    squadCounts,
    starterIds,
    startersCount,
    toggleCaptain,
    type LineupDraft
} from "../../utils/lineup";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "../form/button-styles";
import { CloseDialogButton, ModalDialog } from "../ModalDialog";
import { FormationPicker } from "./FormationPicker";
import { LineupPitch } from "./LineupPitch";
import { PitchPlayer } from "./PitchPlayer";
import { PlayerPickerDialog, type PickerOption } from "./PlayerPickerDialog";
import { SquadTable } from "./SquadTable";
import { StartersCounter } from "./StartersCounter";

/** Dialog to choose a player, open while it is set. */
interface PickerRequest {
    title: string;
    description: string;
    options: PickerOption[];
    initialPlayerId: number | null;
    confirmLabel: string;
    allowEmpty: boolean;
    onConfirm: (playerId: number | null) => void;
}

const POSITION_NAMES: Record<PositionGroup, {one: string; many: string}> = {
    GK: {one: 'portero', many: 'porteros'},
    DEF: {one: 'defensa', many: 'defensas'},
    MID: {one: 'centrocampista', many: 'centrocampistas'},
    FWD: {one: 'delantero', many: 'delanteros'}
};

interface LineupBoardProps {
    team: TeamDetail;
    lineup: Lineup;
    onSave: (draft: LineupDraft) => void;
    isSaving: boolean;
}

function missingText(draft: LineupDraft): string {
    const missing = LINEUP_SIZE - startersCount(draft);
    return missing === 1 ? 'Te falta 1 titular' : `Te faltan ${missing} titulares`;
}

/** Status of the matchday shown next to the selector. */
function MatchdayStatusChip({lineup}: Readonly<{lineup: Lineup}>) {
    const {matchday} = lineup;
    if (matchday.status === 'UPCOMING') {
        return (
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                lineup.editable ? 'bg-primary-soft text-primary' : 'bg-surface-raised text-text'
            }`}>
                <Clock className="size-3.5" aria-hidden/>
                Se bloquea el {formatMatchdayTime(matchday.locksAt)} (primer partido)
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text">
            <Lock className="size-3.5" aria-hidden/>
            {matchday.status === 'LIVE' ? 'En juego: alineación bloqueada' : 'Jornada terminada'}
        </span>
    );
}

/**
 * Lineup of a team on a matchday with its squad (HU13, HU14, HU15 and the captain of HU70). When it is the user's own
 * lineup of the next matchday it can be edited: formation, slots, captain and explicit save.
 */
export function LineupBoard({team, lineup, onSave, isSaving}: Readonly<LineupBoardProps>) {
    const initialDraft = draftFromLineup(lineup);
    const [draft, setDraft] = useState(initialDraft);
    const [menuSlot, setMenuSlot] = useState<string | null>(null);
    const [picker, setPicker] = useState<PickerRequest | null>(null);
    const [mobileTab, setMobileTab] = useState<'lineup' | 'squad'>('lineup');
    const menuRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDialogElement>(null);

    const {editable, captainEnabled, matchday} = lineup;
    const playersById = new Map(team.squad.map((player) => [player.playerPropertyId, player]));
    const starters = starterIds(draft);
    const bench = team.squad.filter((player) => !starters.has(player.playerPropertyId));
    const isDirty = editable && !sameDraft(draft, initialDraft);
    const nextMatchday = lineup.matchdays.find((item) => item.status === 'UPCOMING');

    // useEffect: the options menu of a slot closes when clicking outside it or pressing Escape (document events)
    useEffect(() => {
        if (menuSlot === null) return;
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenuSlot(null);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuSlot(null);
        };
        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menuSlot]);

    const optionsFor = (position: PositionGroup): PickerOption[] => {
        const players = team.squad.filter((player) => player.positionGroup === position);
        const benchFirst = [...players].sort((a, b) =>
            Number(starters.has(a.playerPropertyId)) - Number(starters.has(b.playerPropertyId)));
        return benchFirst.map((player) => ({player, where: starters.has(player.playerPropertyId) ? 'TITULAR' : 'BANQUILLO'}));
    };

    const openSlotPicker = (slot: string) => {
        const position = slotPosition(slot);
        setMenuSlot(null);
        setPicker({
            title: `Elegir ${POSITION_NAMES[position].one}`,
            description: `Solo aparecen los ${POSITION_NAMES[position].many} de tu plantilla. Si eliges un titular, intercambia su sitio con este hueco.`,
            options: optionsFor(position),
            initialPlayerId: draft.slots[slot],
            confirmLabel: 'Alinear',
            allowEmpty: true,
            onConfirm: (playerId) => setDraft((current) =>
                playerId === null ? clearSlot(current, slot) : assignPlayer(current, slot, playerId))
        });
    };

    /** A substitute goes to the first empty slot of his position or, when the line is full, replaces a starter. */
    const lineUpSubstitute = (player: TeamPlayer) => {
        const position = player.positionGroup;
        if (!position) return;
        const emptySlot = firstEmptySlot(draft, position);
        if (emptySlot) {
            setDraft((current) => assignPlayer(current, emptySlot, player.playerPropertyId));
            return;
        }
        const slots = positionSlots(draft.formation, position);
        setPicker({
            title: `¿A quién sustituye ${player.name}?`,
            description: `No quedan huecos de ${POSITION_NAMES[position].one} en el ${draft.formation}. El elegido pasará al banquillo.`,
            options: slots.map((slot) => ({player: playersById.get(draft.slots[slot]!)!, where: 'TITULAR'})),
            initialPlayerId: null,
            confirmLabel: 'Sustituir',
            allowEmpty: false,
            onConfirm: (starterId) => setDraft((current) => {
                const slot = slots.find((item) => current.slots[item] === starterId);
                return slot ? assignPlayer(current, slot, player.playerPropertyId) : current;
            })
        });
    };

    const save = () => {
        if (isComplete(draft)) {
            onSave(draft);
        } else {
            confirmRef.current?.showModal();
        }
    };

    const renderSlot = (slot: string) => {
        const playerId = draft.slots[slot];
        const player = playerId === null ? undefined : playersById.get(playerId);
        const isCaptain = playerId !== null && playerId === draft.captainId;
        const position = slotPosition(slot);

        if (!editable) {
            return (
                <PitchPlayer
                    position={position}
                    player={player}
                    missingPlayerId={player || playerId === null ? undefined : playerId}
                    isCaptain={isCaptain}
                />
            );
        }
        if (!player) {
            return <PitchPlayer position={position} highlightEmpty onClick={() => openSlotPicker(slot)}/>;
        }
        return (
            <PitchPlayer
                position={position}
                player={player}
                isCaptain={isCaptain}
                selected={menuSlot === slot}
                onClick={() => setMenuSlot(menuSlot === slot ? null : slot)}
            >
                {menuSlot === slot && (
                    <div
                        ref={menuRef}
                        role="menu"
                        aria-label={`Opciones de ${player.name}`}
                        className="absolute top-2 left-[88px] z-10 flex w-48 flex-col rounded-lg border border-line-strong bg-surface p-1 shadow-[0_12px_32px_rgba(0,0,0,.5)]"
                    >
                        <button type="button" role="menuitem" onClick={() => openSlotPicker(slot)} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-text hover:bg-surface-raised">
                            <Repeat className="size-4 text-muted" aria-hidden/>Cambiar jugador
                        </button>
                        {captainEnabled && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { setDraft((current) => toggleCaptain(current, player.playerPropertyId)); setMenuSlot(null); }}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-text hover:bg-surface-raised"
                            >
                                <Crown className="size-4 text-muted" aria-hidden/>{isCaptain ? 'Quitar capitanía' : 'Hacer capitán'}
                            </button>
                        )}
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => { setDraft((current) => clearSlot(current, slot)); setMenuSlot(null); }}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-[#FF8A82] hover:bg-surface-raised"
                        >
                            <X className="size-4" aria-hidden/>Mandar al banquillo
                        </button>
                    </div>
                )}
            </PitchPlayer>
        );
    };

    const count = startersCount(draft);
    // The bench is only meaningful while the lineup can still change: past matchdays show the starters they had
    const showBench = matchday.status === 'UPCOMING';

    return (
        <>
            {/* Mobile: the pitch and the squad in tabs */}
            <div className="flex gap-1 rounded-lg border border-line bg-background p-1 lg:hidden" role="tablist" aria-label="Vista">
                {(['lineup', 'squad'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={mobileTab === tab}
                        onClick={() => setMobileTab(tab)}
                        className={`flex-1 rounded-md py-2 text-[13px] ${mobileTab === tab ? 'bg-primary-soft font-bold text-primary' : 'font-medium text-muted'}`}
                    >
                        {tab === 'lineup' ? 'Alineación' : `Plantilla (${team.squad.length})`}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className={`${mobileTab === 'lineup' ? 'flex' : 'hidden'} min-w-0 flex-col gap-4 lg:flex`}>
                    {/* The matchday selector is in the page header, in place of the gameweek badge */}
                    <div className="flex">
                        <MatchdayStatusChip lineup={lineup}/>
                    </div>

                    {matchday.status === 'LIVE' && team.isMine && (
                        <div className="flex gap-2.5 rounded-lg border border-line-strong bg-surface-raised px-3 py-2.5 text-xs leading-[1.55] text-muted [&_b]:text-white">
                            <Lock className="mt-px size-4 shrink-0" aria-hidden/>
                            <p>
                                <b>La jornada {matchday.number} está en juego</b> desde el {formatMatchdayTime(matchday.locksAt)}. Esta alineación ya no se puede cambiar.
                                {nextMatchday && <> Lo que cambies ahora se aplicará a la <Link to="?" className="font-bold text-primary hover:underline">jornada {nextMatchday.number}</Link>, que se bloquea el {formatMatchdayTime(nextMatchday.locksAt)}.</>}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-display text-sm font-extrabold text-muted">FORMACIÓN {draft.formation}</span>
                        <StartersCounter count={count}/>
                    </div>
                    {editable && (
                        <FormationPicker
                            value={draft.formation}
                            squadCounts={squadCounts(team.squad)}
                            onChange={(formation: Formation) => setDraft((current) => changeFormation(current, formation))}
                        />
                    )}

                    <LineupPitch draft={draft} renderSlot={renderSlot}/>

                    {showBench && (
                        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-4" aria-labelledby="bench-title">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 id="bench-title" className="font-display text-base font-bold text-white">BANQUILLO</h2>
                                <span className="text-[11px] text-subtle">No hay cambios automáticos: solo puntúan los titulares.</span>
                            </div>
                            {bench.length === 0 ? (
                                <p className="text-xs text-muted">Todos los jugadores de la plantilla son titulares.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {bench.map((player) => (
                                        <PitchPlayer
                                            key={player.playerPropertyId}
                                            position={player.positionGroup ?? 'MID'}
                                            player={player}
                                            onClick={editable && player.positionGroup ? () => lineUpSubstitute(player) : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {isDirty && (
                        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-line bg-surface px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,.5)]">
                            <p className="text-xs text-muted [&_b]:text-white">
                                <b>Tienes cambios sin guardar.</b> Se aplicarán a la jornada {matchday.number} y a las siguientes hasta que vuelvas a cambiarla.
                            </p>
                            <div className="flex gap-2.5">
                                <button type="button" onClick={() => setDraft(initialDraft)} disabled={isSaving} className={SECONDARY_BUTTON_CLASSES}>
                                    Descartar
                                </button>
                                <button type="button" onClick={save} disabled={isSaving} className={PRIMARY_BUTTON_CLASSES}>
                                    <Check className="size-4" aria-hidden/>
                                    {isSaving ? 'Guardando...' : 'Guardar alineación'}
                                    {!isComplete(draft) && <span className="rounded-full bg-background/25 px-1.5 py-0.5 text-[11px]">{count}/{LINEUP_SIZE}</span>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`${mobileTab === 'squad' ? 'block' : 'hidden'} lg:block`}>
                    <SquadTable
                        squad={team.squad}
                        maxPlayers={team.maxPlayers}
                        starterIds={starters}
                        captainId={draft.captainId}
                        onPlayerClick={editable ? lineUpSubstitute : undefined}
                    />
                </div>
            </div>

            {picker && (
                <PlayerPickerDialog {...picker} onClose={() => setPicker(null)}/>
            )}

            <ModalDialog
                ref={confirmRef}
                title="¿Guardar la alineación incompleta?"
                description={`${missingText(draft)}. Si la jornada ${matchday.number} empieza así, tu equipo no puntuará en ella.`}
            >
                <div className="mt-1 flex justify-end gap-2.5">
                    <CloseDialogButton label="Seguir editando"/>
                    <button
                        type="button"
                        onClick={() => { confirmRef.current?.close(); onSave(draft); }}
                        className={PRIMARY_BUTTON_CLASSES}
                    >
                        Guardar igualmente
                    </button>
                </div>
            </ModalDialog>
        </>
    );
}
