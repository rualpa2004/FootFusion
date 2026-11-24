import { LINEUP_SIZE } from "../../config/lineup.constants";

export function StartersCounter({count, compact = false}: Readonly<{count: number; compact?: boolean}>) {
    const complete = count === LINEUP_SIZE;

    return (
        <output
            aria-label={`${count} de ${LINEUP_SIZE} titulares`}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                complete ? 'bg-primary-soft text-primary' : 'bg-surface-raised text-text'
            }`}
        >
            <span aria-hidden className={`h-1.5 overflow-hidden rounded-full bg-line-strong ${compact ? 'w-10' : 'w-16'}`}>
                <span className="block h-full bg-primary" style={{width: `${(count / LINEUP_SIZE) * 100}%`}}/>
            </span>
            <span aria-hidden>{count} / {LINEUP_SIZE}{compact ? '' : ' titulares'}</span>
        </output>
    );
}
