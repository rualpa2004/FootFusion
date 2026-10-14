import { BrandLogo } from "../components/BrandLogo";

export function LandingPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            {/* The logo's alt text gives the heading its accessible name. */}
            <h1>
                <BrandLogo variant="main" className="h-auto w-full max-w-[640px]"/>
            </h1>
        </main>
    );
}
