import { UserRound } from "lucide-react";
import type { SquadPlayer } from "../../services/league.service";
import { formatMillions, formatPositionLabel } from "../../utils/format";
import { BrandLogo } from "../BrandLogo";
import { POSITION_COLORS, UNKNOWN_POSITION_COLORS } from "../position-styles";

const CARD_SIZE_CLASSES = 'h-[150px] w-[104px] shrink-0 rounded-xl sm:w-[112px]';

/** Back of a card that has not been revealed yet. */
export function PlayerCardBack() {
    return (
        <div
            aria-hidden
            className={`${CARD_SIZE_CLASSES} flex items-center justify-center border-[1.5px] border-primary-line bg-[repeating-linear-gradient(45deg,#0E1A14_0_8px,#0B1510_8px_16px)]`}
        >
            <BrandLogo variant="circle" imageClassName="size-11 opacity-55"/>
        </div>
    );
}

//Card of a squad player: position, club crest, name, market value and clause.
export function PlayerCard({player}: Readonly<{player: SquadPlayer}>) {
    const position = player.positionGroup;
    const colors = position ? POSITION_COLORS[position] : UNKNOWN_POSITION_COLORS;

    return (
        <article
            aria-label={player.name}
            className={`${CARD_SIZE_CLASSES} ${colors} animate-card-reveal flex flex-col items-center gap-1 border-[1.5px] bg-linear-to-b from-[#13261C] to-surface p-2`}
        >
            <div className="flex w-full items-center justify-between text-[10px] font-extrabold">
                <span>{position ? formatPositionLabel(position) : '—'}</span>
                {player.teamLogo
                    ? <img src={player.teamLogo} alt={player.teamName ?? ''} className="size-[18px] object-contain"/>
                    : <span className="text-[9px] text-muted">{player.teamName}</span>}
            </div>
            {player.photo
                ? <img src={player.photo} alt="" className="size-12 rounded-full object-cover"/>
                : <UserRound className="size-12" strokeWidth={1.5} aria-hidden/>}
            <span className="line-clamp-2 text-center text-[11px] leading-tight font-bold text-white">{player.name}</span>
            <span className="mt-auto text-[10px] text-muted">
                Valor <b className="text-primary">{formatMillions(player.marketValue)}</b>
            </span>
            <span className="text-[9px] text-subtle">Cláusula {formatMillions(player.clauseValue)}</span>
        </article>
    );
}