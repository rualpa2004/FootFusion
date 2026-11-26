import { CircleAlert, House, RotateCw, SearchX, ShieldAlert, Trophy, WifiOff, type LucideIcon } from "lucide-react";
import { Link, useRevalidator, useRouteError } from "react-router-dom";
import { describeRouteError, type RouteErrorKind } from "../utils/route-error";
import { BrandLogo } from "./BrandLogo";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "./form/button-styles";

const KIND_ICONS: Record<RouteErrorKind, {icon: LucideIcon; classes: string}> = {
    notFound: {icon: SearchX, classes: 'bg-surface-raised text-muted'},
    forbidden: {icon: ShieldAlert, classes: 'bg-warning/10 text-warning'},
    network: {icon: WifiOff, classes: 'bg-warning/10 text-warning'},
    unexpected: {icon: CircleAlert, classes: 'bg-danger/12 text-danger'}
};

interface ErrorMessageProps {
    inApp: boolean;
}

function ErrorMessage({inApp}: Readonly<ErrorMessageProps>) {
    const error = useRouteError();
    const revalidator = useRevalidator();
    console.error('Route error', error);

    const {kind, title, message, suggestion} = describeRouteError(error);
    const {icon: Icon, classes} = KIND_ICONS[kind];
    // Errors that may not happen again (no connection, server failure): the loaders of the page run again
    const canRetry = kind === 'network' || kind === 'unexpected';
    const isRetrying = revalidator.state === 'loading';
    const homePath = inApp ? '/home' : '/';
    const showSuggestion = inApp && suggestion !== undefined;
    // "Inicio" is the main button only when there is no better way out of the error
    const homeClasses = canRetry || showSuggestion ? SECONDARY_BUTTON_CLASSES : PRIMARY_BUTTON_CLASSES;

    return (
        <div className="m-auto flex max-w-[460px] flex-col items-center gap-4 px-4 py-10 text-center">
            {!inApp && <BrandLogo variant="circle" imageClassName="size-14"/>}
            {kind === 'notFound' && (
                <span className="font-display text-6xl leading-none font-extrabold text-line-strong">404</span>
            )}
            {inApp && (
                <span className={`flex size-14 items-center justify-center rounded-full ${classes}`}>
                    <Icon className="size-[26px]" aria-hidden/>
                </span>
            )}
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-2xl font-extrabold text-white">{title}</h1>
                <p className="text-sm leading-relaxed text-muted">{message}</p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
                {canRetry && (
                    <button type="button" onClick={() => revalidator.revalidate()} disabled={isRetrying} className={PRIMARY_BUTTON_CLASSES}>
                        <RotateCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden/>
                        {isRetrying ? 'Reintentando...' : 'Reintentar'}
                    </button>
                )}
                {showSuggestion && (
                    <Link to={suggestion.to} className={PRIMARY_BUTTON_CLASSES}>
                        <Trophy className="size-4" aria-hidden/>{suggestion.label}
                    </Link>
                )}
                <Link to={homePath} className={homeClasses}>
                    <House className="size-4" aria-hidden/>{inApp ? 'Ir al inicio' : 'Volver al inicio'}
                </Link>
            </div>
        </div>
    );
}

/**
 * Error page of the root route: errors outside the app (public pages, unknown addresses) or of the
 * protected layout itself. It takes the whole screen.
 */
export function RouteErrorPage() {
    return (
        <div className="flex min-h-screen bg-background">
            <ErrorMessage inApp={false}/>
        </div>
    );
}

/**
 * Error page of the protected pages: it is shown inside the layout, so the menu and the session stay
 * and the user can go to another section without starting again.
 */
export function AppErrorPage() {
    return <ErrorMessage inApp/>;
}
