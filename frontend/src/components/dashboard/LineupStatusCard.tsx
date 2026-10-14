import type { LineupStatus } from "../../services/dashboard.service";

interface LineupStatusCardProps {
    status: LineupStatus;
}

export function LineupStatusCard({status}: LineupStatusCardProps) {
    const accent = status.isReady ? 'text-primary' : 'text-warning';
    const dot = status.isReady ? 'bg-primary' : 'bg-warning';

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <h2 className={`font-display text-base font-extrabold ${accent}`}>ESTADO DE LA ALINEACIÓN</h2>
            <p className="text-[13px] text-text">
                {status.isReady
                    ? 'Tu equipo está completamente sano. No se han detectado alertas en tu once titular antes del próximo cierre.'
                    : `Hay ${status.flaggedPlayers} jugador(es) con alertas en tu once titular. Revisa tu alineación antes del próximo cierre.`}
            </p>
            <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${dot}`}/>
                <span className={`text-xs font-bold ${accent}`}>
                    {status.isReady ? 'PLANTILLA VÁLIDA' : 'PLANTILLA INCOMPLETA'}
                </span>
            </div>
        </section>
    );
}
