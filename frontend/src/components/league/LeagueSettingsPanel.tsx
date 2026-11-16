import { Lock } from "lucide-react";
import { MULTIPLIER_TARGET_LABELS } from "../../config/league.constants";
import type { LeagueDetail } from "../../services/league.service";
import { formatDate, formatEuros } from "../../utils/format";
import { ScoringSummary } from "./ScoringFieldset";

function multipliersText({multipliers}: LeagueDetail): string {
    if (!multipliers.enabled) {
        return 'Desactivados';
    }
    const target = multipliers.target ? MULTIPLIER_TARGET_LABELS[multipliers.target] : '';
    return `x${multipliers.factor} · últimas ${multipliers.finalMatchdays} jornadas · ${target}`;
}

// Read-only settings of a league
export function LeagueSettingsPanel({league}: {league: LeagueDetail}) {
    const rows: [string, string][] = [
        ['Creada el', formatDate(league.createdAt)],
        ['Presupuesto inicial', formatEuros(league.initialBudget)],
        ['Dinero por punto', formatEuros(league.pointReward)],
        ['Capitán', league.captainEnabled ? 'Activado' : 'Desactivado'],
        ['Multiplicadores', multipliersText(league)]
    ];

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-white">CONFIGURACIÓN</h2>
                <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Lock className="size-3" aria-hidden/>No editable
                </span>
            </div>
            <dl className="flex flex-col text-[13px]">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-t border-line py-2.5 first:border-t-0">
                        <dt className="text-muted">{label}</dt>
                        <dd className="text-right font-semibold text-white">{value}</dd>
                    </div>
                ))}
            </dl>
            {league.scoring && (
                <>
                    <h3 className="text-xs font-bold tracking-[.04em] text-muted">PUNTUACIÓN</h3>
                    <ScoringSummary scoring={league.scoring}/>
                </>
            )}
        </section>
    );
}