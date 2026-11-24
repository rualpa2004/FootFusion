import type { TeamPlayer } from "../../services/team.service";
import { formatMillions, formatPositionLabel } from "../../utils/format";
import { POSITION_PILL_COLORS } from "../position-styles";

interface SquadTableProps {
    squad: TeamPlayer[];
    maxPlayers: number;
    starterIds: Set<number> | null;
    captainId: number | null;
    onPlayerClick?: (player: TeamPlayer) => void;
}

function lineupState(player: TeamPlayer, starterIds: Set<number> | null, captainId: number | null): string | null {
    if (!starterIds) return null;
    if (!starterIds.has(player.playerPropertyId)) return 'Banquillo';
    return player.playerPropertyId === captainId ? 'Titular (C)' : 'Titular';
}

/** Whole squad of a team (HU13): position, club, lineup state, market value and clause. Ordered by the backend. */
export function SquadTable({squad, maxPlayers, starterIds, captainId, onPlayerClick}: Readonly<SquadTableProps>) {
    const totalValue = squad.reduce((sum, player) => sum + player.marketValue, 0);

    return (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5" aria-labelledby="squad-title">
            <div>
                <h2 id="squad-title" className="font-display text-lg font-bold text-white">PLANTILLA</h2>
                <p className="text-xs text-muted">
                    {squad.length} de {maxPlayers} jugadores{onPlayerClick ? '. Pulsa un suplente para alinearlo.' : ''}
                </p>
            </div>

            <table className="w-full text-[13px]">
                <thead>
                    <tr className="text-left text-[11px] font-bold text-muted">
                        <th scope="col" className="py-1.5 pr-2">POS.</th>
                        <th scope="col" className="py-1.5 pr-2">JUGADOR</th>
                        <th scope="col" className="py-1.5 pr-2 text-right">VALOR</th>
                        <th scope="col" className="py-1.5 text-right">CLÁUSULA</th>
                    </tr>
                </thead>
                <tbody>
                    {squad.map((player) => {
                        const state = lineupState(player, starterIds, captainId);
                        const isBench = state === 'Banquillo';
                        return (
                            <tr key={player.playerPropertyId} className="border-t border-line">
                                <td className="py-2 pr-2">
                                    {player.positionGroup && (
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${POSITION_PILL_COLORS[player.positionGroup]}`}>
                                            {formatPositionLabel(player.positionGroup)}
                                        </span>
                                    )}
                                </td>
                                <td className="max-w-0 py-2 pr-2">
                                    {onPlayerClick && isBench ? (
                                        <button
                                            type="button"
                                            onClick={() => onPlayerClick(player)}
                                            className="block max-w-full truncate text-left font-bold text-white underline-offset-2 hover:text-primary hover:underline"
                                        >
                                            {player.name}
                                        </button>
                                    ) : (
                                        <b className="block truncate text-white">{player.name}</b>
                                    )}
                                    <span className="block truncate text-[11px] text-muted">
                                        {player.teamName}
                                        {state && <> · <span className={isBench ? '' : 'text-primary'}>{state}</span></>}
                                    </span>
                                </td>
                                <td className="py-2 pr-2 text-right font-semibold whitespace-nowrap text-white">{formatMillions(player.marketValue)}</td>
                                <td className="py-2 text-right whitespace-nowrap text-muted">{formatMillions(player.clauseValue)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="flex justify-between border-t border-line pt-3 text-[13px]">
                <span className="text-muted">Valor total</span>
                <b className="text-white">{formatMillions(totalValue)}</b>
            </div>
        </section>
    );
}
