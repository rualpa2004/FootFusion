import type { ReactNode } from "react";

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

/** Card for the login/register forms */
export function AuthCard({title, subtitle, children}: AuthCardProps) {
    return (
        <section className="flex w-full max-w-[440px] flex-col gap-5 rounded-2xl border border-line bg-surface p-6 short:gap-4 short:p-5">
            <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-[28px] font-extrabold text-white short:text-2xl">{title}</h2>
                <p className="text-[13px] leading-[1.5] text-muted">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}
