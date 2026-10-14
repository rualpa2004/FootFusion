import { BrandLogo } from "./BrandLogo";

export function LoadingScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4" role="status">
            <BrandLogo variant="main" className="h-auto w-80 max-w-full"/>
            <p className="text-sm text-muted">Cargando...</p>
        </div>
    );
}
