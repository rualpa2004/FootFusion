import { Check, Shirt } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/** Player example positions */
const PITCH_PLAYERS = [
    {label: 'DEL', left: 218, top: 34},
    {label: 'MED', left: 112, top: 97},
    {label: 'MED', left: 324, top: 97},
    {label: 'DEF', left: 218, top: 167}
];

const FEATURES = ['Crea tu plantilla', 'Compite con amigos', 'Escala en la clasificación'];

/** Left column of the login/register screens: tagline, pitch illustration and feature list. */
export function HeroPanel() {
    return (
        <section className="flex w-[532px] shrink-0 flex-col gap-6">
            <BrandLogo variant="horizontal" className="h-auto w-[360px]"/>

            <h1 className="font-display text-5xl leading-[1.05] font-extrabold text-white">
                Tu plantilla. Tus rivales.<br/>
                <span className="text-primary">Tu juego.</span>
            </h1>

            <p className="w-[450px] text-sm leading-[1.6] text-muted">
                Crea el equipo de tus sueños, enfréntate a tus amigos y haz que cada jornada cuente.
            </p>

            {/* Decorative pitch with players in a formation. */}
            <div className="relative h-[260px] w-[480px] overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden>
                <div className="absolute top-5 left-5 h-[220px] w-[440px] rounded border border-primary-line"/>
                <div className="absolute top-[129px] left-5 h-px w-[440px] bg-primary-line"/>
                <div className="absolute top-[92px] left-[202px] size-[76px] rounded-full border border-primary-line"/>
                <div className="absolute top-5 left-[164px] h-11 w-[152px] border border-primary-line"/>
                <div className="absolute top-[196px] left-[164px] h-11 w-[152px] border border-primary-line"/>

                {PITCH_PLAYERS.map((player) => (
                    <div
                        key={`${player.label}-${player.left}-${player.top}`}
                        className="absolute flex flex-col items-center gap-1"
                        style={{left: player.left, top: player.top}}
                    >
                        <div className="flex h-10 w-11 items-center justify-center rounded-lg border border-primary-line bg-primary-soft">
                            <Shirt className="size-[22px] text-primary" strokeWidth={1.8}/>
                        </div>
                        <span className="text-[9px] font-bold text-muted">{player.label}</span>
                    </div>
                ))}
            </div>

            <ul className="flex items-center gap-6">
                {FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5">
                        <Check className="size-3.5 text-primary" strokeWidth={2.5} aria-hidden/>
                        <span className="text-[11px] text-text">{feature}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
