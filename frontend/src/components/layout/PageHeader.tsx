import { Bell, LogOut } from "lucide-react";
import { useManagerSummary } from "../../hooks/useManagerSummary";

interface PageHeaderProps {
    title: string;
    subtitle: string;
}

/** Title row of protected pages, with the current gameweek and the quick actions. */
export function PageHeader({title, subtitle}: PageHeaderProps) {
    const {currentGameweek} = useManagerSummary();

    return (
        <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
                <h1 className="font-display text-[28px] font-extrabold text-white">{title}</h1>
                <p className="text-sm text-muted">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
                <span className="rounded-md bg-surface-raised px-3 py-1.5 text-xs font-bold text-text">
                    JORNADA {currentGameweek}
                </span>
                {/* TODO: notifications. Will open the user's notifications panel (the backend already
                    has a notification entity) and show a badge with the unread count. */}
                <button
                    type="button"
                    disabled
                    aria-label="Notificaciones"
                    className="flex size-10 items-center justify-center rounded-lg border border-line bg-surface"
                >
                    <Bell className="size-5 text-white" aria-hidden/>
                </button>
                {/* TODO: logout. Will become a <Form method="post" action="/logout"> pointing to a route
                    whose action calls logout() from auth.service and returns redirect('/login'). */}
                <button
                    type="button"
                    disabled
                    aria-label="Cerrar sesión"
                    className="flex size-10 items-center justify-center rounded-lg border border-line bg-surface"
                >
                    <LogOut className="size-5 text-white" aria-hidden/>
                </button>
            </div>
        </header>
    );
}
