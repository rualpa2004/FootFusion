import type { Competition } from "../../services/league.service";

interface CompetitionLogoProps {
    competition: Competition;
    className?: string;
}

/** Logo of a competition, or its initials when it has no logo. */
export function CompetitionLogo({competition, className = 'size-[18px]'}: Readonly<CompetitionLogoProps>) {
    if (competition.logo) {
        return <img src={competition.logo} alt="" className={`${className} shrink-0 rounded-full bg-white object-contain p-px`}/>;
    }

    const initials = competition.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
    return (
        <span
            aria-hidden
            className={`${className} flex shrink-0 items-center justify-center rounded-full bg-surface-raised text-[8px] font-extrabold text-white`}
        >
            {initials}
        </span>
    );
}

/** Rounded chip with the logo and the name of a competition. */
export function CompetitionChip({competition}: Readonly<{competition: Competition}>) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised py-1 pr-2 pl-1 text-[11px] font-semibold text-text">
            <CompetitionLogo competition={competition}/>
            {competition.name}
        </span>
    );
}