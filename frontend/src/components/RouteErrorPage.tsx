import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

export function RouteErrorPage() {
    const error = useRouteError();
    console.error('Route error', error);

    const isNotFound = isRouteErrorResponse(error) && error.status === 404;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
            <BrandLogo variant="circle" showName imageClassName="size-16"/>
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-3xl font-extrabold text-white">
                    {isNotFound ? 'Página no encontrada' : 'Algo ha salido mal'}
                </h1>
                <p className="text-sm text-muted">
                    {isNotFound
                        ? 'La página que buscas no existe.'
                        : 'Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.'}
                </p>
            </div>
            <Link to="/" className="rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-background">
                Volver al inicio
            </Link>
        </div>
    );
}
