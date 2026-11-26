import { ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import type { MyLeague } from "../../services/league.service";
import { formatNumber, formatRank } from "../../utils/format";
import { SECONDARY_BUTTON_CLASSES } from "../form/button-styles";

const ROW_COLUMNS = 'grid grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_80px_80px_16px]';

function LeagueRow({league}: Readonly<{league: MyLeague}>) {
    const {team} = league;
    const points = `${formatNumber(team.totalPoints)} pts`;

    return (
        <li>
            <Link
                to={`/leagues/${league.id}`}
                className={`${ROW_COLUMNS} rounded-lg bg-background px-3 py-3 transition-colors hover:bg-surface-raised`}
            >
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-white">{league.name}</span>
                    <span className="truncate text-xs text-muted">
                        {team.name}<span className="sm:hidden"> · {points}</span>
                    </span>
                </span>
                <span className="hidden text-right font-display font-extrabold text-white sm:block">{points}</span>
                <span className="flex flex-col items-end">
                    <span className={`font-display font-extrabold ${team.rank === 1 ? 'text-primary' : 'text-white'}`}>
                        {formatRank(team.rank)}
                    </span>
                    <span className="text-[11px] text-muted">de {league.membersCount}</span>
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden/>
            </Link>
        </li>
    );
}

/** The user's leagues with their team, points and position. Each row opens the league. */
export function ProfileLeagues({leagues}: Readonly<{leagues: MyLeague[]}>) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-col gap-1">
                <h2 className="font-display text-lg font-bold text-white">MIS LIGAS</h2>
                <p className="text-xs text-muted">Tu equipo, tus puntos y tu puesto en cada liga. Pulsa una para abrirla.</p>
            </div>

            {leagues.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <div aria-hidden className={`${ROW_COLUMNS} px-3 pb-1 text-[11px] font-bold text-muted`}>
                        <span>LIGA</span>
                        <span className="hidden text-right sm:block">PUNTOS</span>
                        <span className="text-right">PUESTO</span>
                    </div>
                    <ul className="flex flex-col gap-1">
                        {leagues.map((league) => <LeagueRow key={league.id} league={league}/>)}
                    </ul>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2.5 p-4 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Trophy className="size-5" aria-hidden/>
                    </span>
                    <p className="text-[13px] text-muted">Todavía no juegas en ninguna liga.</p>
                    <Link to="/leagues" className={SECONDARY_BUTTON_CLASSES}>Crear o unirme a una liga</Link>
                </div>
            )}
        </section>
    );
}
