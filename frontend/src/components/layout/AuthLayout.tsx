import { Outlet } from "react-router-dom";
import { BrandLogo } from "../BrandLogo";
import { HeroPanel } from "../auth/HeroPanel";

/**
 * Shared frame of /login and /register: header, hero panel and footer.
 * The form card of each page is rendered through <Outlet/>.
 */
export function AuthLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="flex h-[88px] items-center justify-between px-4 short:h-16 sm:px-14">
                <BrandLogo variant="circle" showName className="hidden xl:flex"/>
                <BrandLogo variant="horizontal" className="h-10 w-auto xl:hidden"/>
                <span className="hidden text-xs text-muted sm:inline">El Fantasy de fútbol definitivo</span>
            </header>

            <main className="flex flex-1 items-center gap-[100px] px-4 py-4 short:py-2 sm:px-14">
                <div className="hidden xl:block">
                    <HeroPanel/>
                </div>
                <div className="flex flex-1 justify-center">
                    <Outlet/>
                </div>
            </main>

            <footer className="flex flex-col items-center justify-between gap-2 px-4 py-6 sm:h-[72px] sm:flex-row sm:px-14 sm:py-0 short:sm:h-12">
                <span className="text-xs text-muted">© 2026 FootFusion</span>
                <nav className="flex items-center gap-5">
                    {/* TODO: link to the legal pages once they exist (e.g. /terms and /privacy). */}
                    <span className="text-xs text-muted">Términos del servicio</span>
                    <span className="text-xs text-muted">Política de privacidad</span>
                </nav>
            </footer>
        </div>
    );
}
