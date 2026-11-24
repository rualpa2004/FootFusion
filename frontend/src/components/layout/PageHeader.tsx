import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";

interface PageHeaderProps {
    title: string;
    subtitle: string;
    titleAside?: ReactNode;
    /**
     * Matchday control next to the quick actions, only in the pages that depend on a matchday (e.g. the matchday
     * selector of the lineup). The other pages (dashboard, leagues) show none.
     */
    gameweek?: ReactNode;
}

/** Look of the matchday control of the header ("JORNADA 13"). */
export const GAMEWEEK_BADGE_CLASSES = 'rounded-md bg-surface-raised px-3 py-1.5 text-xs font-bold text-text';

/** Title row of protected pages, with the quick actions and, when the page needs it, its matchday. */
export function PageHeader({title, subtitle, titleAside, gameweek}: Readonly<PageHeaderProps>) {
    return (
        <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-[28px] font-extrabold break-words text-white">{title}</h1>
                    {titleAside}
                </div>
                <p className="text-sm text-muted">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
                {gameweek}
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
                <LogoutButton/>
            </div>
        </header>
    );
}