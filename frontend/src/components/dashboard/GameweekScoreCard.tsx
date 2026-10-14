import { Clock } from "lucide-react";
import type { GameweekScore, TransferDeadline } from "../../services/dashboard.service";
import { formatTimeRemaining } from "../../utils/format";

interface GameweekScoreCardProps {
    score: GameweekScore;
    deadline: TransferDeadline;
}

export function GameweekScoreCard({score, deadline}: GameweekScoreCardProps) {
    return (
        <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-bold text-muted">PUNTUACIÓN J{score.gameweek}</h2>
                <div className="flex items-baseline gap-2">
                    <span className="font-display text-6xl font-extrabold text-primary">{score.points}</span>
                    <span className="text-lg text-muted">pts</span>
                </div>
                <p className="text-sm text-text">
                    Media de esta jornada: <span className="font-bold text-white">{score.averagePoints} pts</span>
                </p>
            </div>

            <div className="flex w-full flex-col gap-3 rounded-xl bg-surface-raised p-4 md:w-60">
                <h3 className="text-xs font-bold text-muted">CIERRE DE FICHAJES J{deadline.gameweek}</h3>
                <div className="flex items-center gap-2">
                    <Clock className="size-4 text-warning" aria-hidden/>
                    {/* The remaining time is computed once per render from the loader data. A live
                        countdown would need a timer (setInterval inside useEffect) to re-render every minute. */}
                    <time dateTime={deadline.deadline} className="font-display text-[22px] font-bold text-white">
                        {formatTimeRemaining(deadline.deadline)}
                    </time>
                </div>
                {/* TODO: will navigate to the squad management page (/lineup) once it exists. */}
                <button
                    type="button"
                    disabled
                    className="rounded-lg bg-primary py-2 text-xs font-extrabold text-background disabled:cursor-not-allowed"
                >
                    Gestionar plantilla
                </button>
            </div>
        </section>
    );
}
