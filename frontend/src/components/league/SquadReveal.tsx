import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PITCH_ROWS, type PositionGroup } from "../../config/league.constants";
import type { JoinedLeague, SquadPlayer } from "../../services/league.service";
import { formatEuros, formatPositionLabel } from "../../utils/format";
import { PRIMARY_BUTTON_CLASSES } from "../form/button-styles";
import { InvitePanel } from "./InvitePanel";
import { PlayerCard, PlayerCardBack } from "./PlayerCard";

export const REVEAL_INTERVAL_MS = 1000;

// Cards are revealed from the goalkeeper up to the forwards
const REVEAL_ORDER: readonly PositionGroup[] = [...PITCH_ROWS].reverse();

interface SquadRevealProps {
    joined: JoinedLeague;
    /** True after creating the league: shows the invitation (code, link and QR) at the end. */
    showInvite?: boolean;
}

function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function sortForReveal(squad: SquadPlayer[]): SquadPlayer[] {
    const rank = (player: SquadPlayer) => player.positionGroup ? REVEAL_ORDER.indexOf(player.positionGroup) : REVEAL_ORDER.length;
    return [...squad].sort((a, b) => rank(a) - rank(b));
}

/**
 * Initial squad received after creating or joining a league, shown as cards that turn over one by one.
 * It is only shown with the response of the action: reloading the page does not show it again.
 */
export function SquadReveal({joined, showInvite = false}: Readonly<SquadRevealProps>) {
    const revealOrder = sortForReveal(joined.squad);
    const total = revealOrder.length;
    // Number of cards already turned over.
    const [revealedCount, setRevealedCount] = useState(() => prefersReducedMotion() ? total : 0);
    const isComplete = revealedCount >= total;

    // useEffect: the animation is a timer that must start when the reveal is shown and stop when it finishes or the component is removed.
    useEffect(() => {
        if (isComplete) {
            return;
        }
        const timer = window.setInterval(() => setRevealedCount((count) => count + 1), REVEAL_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [isComplete]);

    const revealed = new Set(revealOrder.slice(0, revealedCount).map((player) => player.playerPropertyId));
    const squadValue = joined.squad.reduce((sum, player) => sum + player.marketValue, 0);
    const countByPosition = (position: PositionGroup) => joined.squad.filter((player) => player.positionGroup === position).length;

    return (
        <section className="flex flex-col items-center gap-6 py-2" aria-labelledby="squad-reveal-title">
            <div className="flex flex-col items-center gap-1.5 text-center">
                <h1 id="squad-reveal-title" className="font-display text-[30px] font-extrabold text-white">
                    {isComplete ? '¡Tu plantilla está lista!' : 'Tu plantilla inicial'}
                </h1>
                <p className="text-sm text-muted">{joined.league.name} · {joined.team.name}</p>
            </div>

            <div className="flex flex-col items-center gap-3.5">
                {PITCH_ROWS.map((position) => (
                    <div key={position} className="flex flex-wrap justify-center gap-3">
                        {joined.squad.filter((player) => player.positionGroup === position).map((player) => (
                            revealed.has(player.playerPropertyId)
                                ? <PlayerCard key={player.playerPropertyId} player={player}/>
                                : <PlayerCardBack key={player.playerPropertyId}/>
                        ))}
                    </div>
                ))}
            </div>

            {!isComplete ? (
                <button
                    type="button"
                    onClick={() => setRevealedCount(total)}
                    className="text-[13px] font-semibold text-muted transition-colors hover:text-white"
                >
                    Saltar animación
                </button>
            ) : (
                <>
                    <dl className="flex flex-wrap justify-center gap-3">
                        <div className="min-w-[150px] rounded-[10px] border border-line bg-surface px-4 py-3 text-center">
                            <dt className="text-[11px] text-muted">Valor de la plantilla</dt>
                            <dd className="font-display text-lg font-bold text-white">{formatEuros(squadValue)}</dd>
                        </div>
                        <div className="min-w-[150px] rounded-[10px] border border-line bg-surface px-4 py-3 text-center">
                            <dt className="text-[11px] text-muted">Presupuesto</dt>
                            <dd className="font-display text-lg font-bold text-primary">{formatEuros(joined.team.budget)}</dd>
                        </div>
                        <div className="min-w-[150px] rounded-[10px] border border-line bg-surface px-4 py-3 text-center">
                            <dt className="text-[11px] text-muted">Jugadores</dt>
                            <dd className="font-display text-lg font-bold text-white">
                                {REVEAL_ORDER.map((position) => `${countByPosition(position)} ${formatPositionLabel(position)}`).join(' · ')}
                            </dd>
                        </div>
                    </dl>

                    {showInvite && (
                        <div className="w-full max-w-[560px]">
                            <InvitePanel leagueName={joined.league.name} joinCode={joined.league.joinCode}/>
                        </div>
                    )}

                    <Link to={`/leagues/${joined.league.id}`} className={`${PRIMARY_BUTTON_CLASSES} h-12 px-7 text-sm`}>
                        Ir a la liga
                        <ArrowRight className="size-4" aria-hidden/>
                    </Link>
                </>
            )}
        </section>
    );
}
