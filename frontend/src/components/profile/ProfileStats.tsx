import { formatNumber, formatRank } from "../../utils/format";
import type { ProfileStats as Stats } from "../../utils/profile";

interface StatCardProps {
    label: string;
    value: string;
    detail: string;
    highlight?: boolean;
}

function StatCard({label, value, detail, highlight = false}: Readonly<StatCardProps>) {
    return (
        <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <dt className="text-[11px] font-bold tracking-[.04em] text-muted">{label}</dt>
            <dd className={`font-display text-2xl font-extrabold sm:text-[28px] ${highlight ? 'text-primary' : 'text-white'}`}>{value}</dd>
            <dd className="hidden truncate text-xs text-muted sm:block">{detail}</dd>
        </div>
    );
}

/** Three stats of the user, derived from their leagues: leagues, total points and best position. */
export function ProfileStats({stats}: Readonly<{stats: Stats}>) {
    const {leaguesCount, totalPoints, bestRank} = stats;

    return (
        <dl className="grid grid-cols-3 gap-3 sm:gap-5">
            <StatCard label="LIGAS" value={formatNumber(leaguesCount)} detail="en las que juegas"/>
            <StatCard
                label="PUNTOS TOTALES"
                value={formatNumber(totalPoints)}
                detail={leaguesCount === 1 ? 'de tu equipo' : `suma de tus ${leaguesCount} equipos`}
                highlight
            />
            <StatCard
                label="MEJOR PUESTO"
                value={bestRank ? formatRank(bestRank.rank) : '–'}
                detail={bestRank ? `en ${bestRank.leagueName}` : 'sin ligas todavía'}
            />
        </dl>
    );
}
