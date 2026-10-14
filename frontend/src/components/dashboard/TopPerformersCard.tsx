import { Shirt } from "lucide-react";
import type { TopPerformer } from "../../services/dashboard.service";
import { formatPositionLabel, formatPrice } from "../../utils/format";

interface TopPerformersCardProps {
    gameweek: number;
    players: TopPerformer[];
}

export function TopPerformersCard({gameweek, players}: TopPerformersCardProps) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-white">MEJORES JUGADORES J{gameweek}</h2>

            <ul className="flex flex-col gap-3">
                {players.map((player) => (
                    <li key={player.id} className="flex items-center gap-3 rounded-[10px] bg-surface-raised p-3">
                        {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="size-10 shrink-0 rounded-lg object-cover"/>
                        ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface" aria-hidden>
                                <Shirt className="size-5 text-muted"/>
                            </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-bold text-white">{player.name}</span>
                            <span className="text-[11px] text-muted">
                                {formatPositionLabel(player.position)} • {player.team} • {formatPrice(player.priceInMillions)}
                            </span>
                        </div>
                        <span className="rounded-md bg-primary-soft px-2.5 py-1 font-display text-sm font-extrabold text-primary">
                            +{player.points}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
