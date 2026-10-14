import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import type { LeagueSummary, RankTrend } from "../../services/dashboard.service";
import { formatNumber } from "../../utils/format";

const TREND_ICONS: Record<RankTrend, {icon: typeof ChevronUp; className: string; label: string}> = {
    up: {icon: ChevronUp, className: 'text-primary', label: 'Sube'},
    same: {icon: Minus, className: 'text-subtle', label: 'Se mantiene'},
    down: {icon: ChevronDown, className: 'text-danger', label: 'Baja'}
};

interface LeagueStandingsCardProps {
    league: LeagueSummary;
}

export function LeagueStandingsCard({league}: LeagueStandingsCardProps) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-lg font-bold text-white">{league.name}</h2>
                {/* TODO: will link to the full league standings (e.g. /leagues/:leagueId). */}
                <span className="shrink-0 text-xs font-bold text-primary">Ver todo</span>
            </div>

            <ol className="flex flex-col gap-2">
                {league.standings.map((standing) => {
                    const trend = TREND_ICONS[standing.trend];
                    const TrendIcon = trend.icon;

                    return (
                        <li
                            key={standing.position}
                            className="flex items-center justify-between gap-4 rounded-lg bg-surface-raised p-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`font-display text-sm font-extrabold ${
                                    standing.position === 1 ? 'text-primary' : 'text-muted'
                                }`}>
                                    {standing.position}
                                </span>
                                <span className="truncate text-sm font-semibold text-white">
                                    {standing.managerName}{standing.isCurrentUser && ' (Tú)'}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-sm font-bold text-text">{formatNumber(standing.points)} pts</span>
                                <TrendIcon className={`size-3.5 ${trend.className}`} strokeWidth={3} aria-label={trend.label}/>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
