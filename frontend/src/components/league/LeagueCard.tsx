import { Link } from "react-router-dom";
import type { MyLeague } from "../../services/league.service";
import { formatEuros, formatNumber } from "../../utils/format";
import { CompetitionChip } from "./CompetitionLogo";
import { OwnerBadge } from "./OwnerBadge";

// Card of a league in the user's leagues list
export function LeagueCard({league}: {league: MyLeague}) {
    const occupancy = Math.min(100, (league.membersCount / league.maxTeams) * 100);

    return (
        <Link
            to={`/leagues/${league.id}`}
            className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-primary-line"
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 font-display text-lg font-extrabold break-words text-white">{league.name}</h3>
                {league.isOwner && <OwnerBadge/>}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {league.competitions.map((competition) => (
                    <CompetitionChip key={competition.id} competition={competition}/>
                ))}
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-muted">
                    <span>Miembros</span>
                    <span className="font-bold text-white">{league.membersCount} / {league.maxTeams}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <span className="block h-full rounded-full bg-primary" style={{width: `${occupancy}%`}}/>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-background p-3 text-xs">
                <div className="flex min-w-0 flex-col">
                    <span className="text-muted">Tu equipo</span>
                    <span className="truncate text-[13px] font-bold text-white">{league.team.name}</span>
                    <span className="text-muted">Presupuesto: {formatEuros(league.team.budget)}</span>
                </div>
                <span className="shrink-0 font-display text-lg font-extrabold text-primary">
                    {formatNumber(league.team.totalPoints)} <span className="text-[11px] text-muted">pts</span>
                </span>
            </div>
        </Link>
    );
}