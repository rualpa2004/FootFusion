import { isRouteErrorResponse } from "react-router-dom";
import { ApiError } from "../services/api.client";

export type RouteErrorKind = 'notFound' | 'forbidden' | 'network' | 'unexpected';

export interface RouteErrorDescription {
    kind: RouteErrorKind;
    title: string;
    message: string;
    /** Page that makes sense to go to after the error (e.g. the leagues after a league that does not exist). */
    suggestion?: {to: string; label: string};
}

const MY_LEAGUES = {to: '/leagues', label: 'Ver mis ligas'};

// Messages of the "not found" responses the loaders throw (data('League not found', {status: 404}))
const NOT_FOUND_RESOURCES: Record<string, Omit<RouteErrorDescription, 'kind'>> = {
    'League not found': {
        title: 'No encontramos esta liga',
        message: 'Puede que el enlace esté mal escrito o que la liga se haya eliminado.',
        suggestion: MY_LEAGUES
    },
    'Team not found': {
        title: 'No encontramos este equipo',
        message: 'Puede que el enlace esté mal escrito o que el equipo no sea de esta liga.',
        suggestion: MY_LEAGUES
    }
};

function statusOf(error: unknown): number | null {
    if (isRouteErrorResponse(error)) return error.status;
    if (error instanceof ApiError) return error.status;
    return null;
}

export function describeRouteError(error: unknown): RouteErrorDescription {
    const status = statusOf(error);

    if (status === 404) {
        const resource = isRouteErrorResponse(error) && typeof error.data === 'string'
            ? NOT_FOUND_RESOURCES[error.data]
            : undefined;
        return {kind: 'notFound', ...(resource ?? {title: 'Página no encontrada', message: 'La página que buscas no existe.'})};
    }
    if (status === 403) {
        return {kind: 'forbidden', title: 'No tienes acceso', message: 'No tienes permiso para ver esta página.'};
    }
    
    if (error instanceof TypeError && status === null && /fetch|network|load failed/i.test(error.message)) {
        return {
            kind: 'network',
            title: 'No se ha podido conectar',
            message: 'Comprueba tu conexión a internet o inténtalo de nuevo en unos minutos.'
        };
    }
    return {
        kind: 'unexpected',
        title: 'Algo ha salido mal',
        message: 'Ha ocurrido un error inesperado. Inténtalo de nuevo; si sigue pasando, vuelve más tarde.'
    };
}
