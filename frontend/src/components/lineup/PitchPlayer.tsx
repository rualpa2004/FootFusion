import { Plus, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { PositionGroup } from "../../config/league.constants";
import type { TeamPlayer } from "../../services/team.service";
import { formatMillions, formatPositionLabel } from "../../utils/format";
import { POSITION_COLORS } from "../position-styles";

interface PitchPlayerProps {
    position: PositionGroup;
    player?: TeamPlayer;
    /** Player id of a starter that is no longer in the squad (only in past matchdays). */
    missingPlayerId?: number;
    isCaptain?: boolean;
    highlightEmpty?: boolean;
    selected?: boolean;
    onClick?: () => void;
    children?: ReactNode;   //Options menu
}

function PlayerFace({player}: Readonly<{player: TeamPlayer}>) {
    return player.photo
        ? <img src={player.photo} alt="" className="size-full rounded-full object-cover"/>
        : <UserRound className="size-7" strokeWidth={1.5} aria-hidden/>;
}

function slotLabel({position, player, missingPlayerId, highlightEmpty}: PitchPlayerProps): string {
    if (player) return player.name;
    if (missingPlayerId !== undefined) return 'Ya no está';
    return highlightEmpty ? `Falta ${formatPositionLabel(position)}` : 'Vacío';
}

/** Ring of the photo: the position colour for a player, dashed for an empty slot (red when it has to be filled). */
function ringClasses({position, player, highlightEmpty}: PitchPlayerProps): string {
    if (player) return `border-2 ${POSITION_COLORS[position]} bg-surface`;
    if (highlightEmpty) return 'border-2 border-dashed border-[#FF8A82] bg-danger/8 text-[#FF8A82]';
    return 'border-2 border-dashed border-line-strong bg-surface/60 text-subtle';
}

function labelColor({player, highlightEmpty}: PitchPlayerProps): string {
    if (player) return 'text-white';
    return highlightEmpty ? 'text-[#FF8A82]' : 'text-subtle';
}

/** A slot of the pitch or of the bench: photo with the club crest and the captain mark, name and market value. */
export function PitchPlayer(props: Readonly<PitchPlayerProps>) {
    const {player, isCaptain = false, selected = false, onClick, children} = props;
    const name = slotLabel(props);
    const ring = ringClasses(props);

    const content = (
        <>
            <span className={`relative flex size-14 items-center justify-center rounded-full ${ring} ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0F291B]' : ''}`}>
                {player ? <PlayerFace player={player}/> : <Plus className="size-5" aria-hidden/>}
                {isCaptain && (
                    <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-background" aria-label="Capitán">C</span>
                )}
                {player?.teamLogo && (
                    <img src={player.teamLogo} alt={player.teamName ?? ''} className="absolute -right-1.5 -bottom-1 size-5 rounded-full bg-white object-contain p-px"/>
                )}
            </span>
            <span className={`max-w-full truncate rounded bg-background/70 px-1 text-[11px] font-bold ${labelColor(props)}`}>
                {name}
            </span>
            {player && <span className="text-[10px] text-muted">{formatMillions(player.marketValue)}</span>}
        </>
    );

    const classes = 'flex w-[84px] flex-col items-center gap-1 rounded-lg p-1 text-center';
    return (
        <div className="relative">
            {onClick ? (
                <button
                    type="button"
                    onClick={onClick}
                    aria-label={player ? `${player.name}${isCaptain ? ' (capitán)' : ''}` : `${name}: elegir jugador`}
                    aria-expanded={children ? selected : undefined}
                    className={`${classes} transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-primary`}
                >
                    {content}
                </button>
            ) : (
                <div className={classes}>{content}</div>
            )}
            {children}
        </div>
    );
}
