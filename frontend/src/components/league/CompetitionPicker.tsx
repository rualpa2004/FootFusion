import { Check } from "lucide-react";
import { useState } from "react";
import { LEAGUE_MAX_COMPETITIONS, LEAGUE_MIN_COMPETITIONS } from "../../config/league.constants";
import type { Competition } from "../../services/league.service";
import { CompetitionLogo } from "./CompetitionLogo";

interface CompetitionPickerProps {
    competitions: Competition[];
    error?: string;
}

/** Selectable cards of the competitions of a new league (checkboxes named "competitionIds", 1 to 3). */
export function CompetitionPicker({competitions, error}: CompetitionPickerProps) {
    // Selected ids, needed to show the counter and to block more than the maximum while choosing.
    const [selected, setSelected] = useState<number[]>([]);
    const isFull = selected.length >= LEAGUE_MAX_COMPETITIONS;

    function toggle(id: number, checked: boolean) {
        setSelected((current) => checked ? [...current, id] : current.filter((selectedId) => selectedId !== id));
    }

    return (
        <fieldset className="flex flex-col gap-4" aria-describedby="competitions-message">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <legend className="font-display text-lg font-bold text-white">COMPETICIONES</legend>
                    <p className="text-xs leading-5 text-muted">
                        Elige de {LEAGUE_MIN_COMPETITIONS} a {LEAGUE_MAX_COMPETITIONS}. Los jugadores de la liga saldrán de los equipos de estas competiciones.
                    </p>
                </div>
                <span className="shrink-0 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-bold text-primary">
                    {selected.length} / {LEAGUE_MAX_COMPETITIONS}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {competitions.map((competition) => {
                    const isSelected = selected.includes(competition.id);
                    const isDisabled = isFull && !isSelected;

                    return (
                        <label
                            key={competition.id}
                            className={`relative flex items-center gap-2.5 rounded-[10px] border p-3 text-[13px] transition-colors ${
                                isSelected ? 'border-primary bg-primary-soft' : 'border-line bg-background'
                            } ${isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-primary-line'} has-focus-visible:outline-2 has-focus-visible:outline-primary`}
                        >
                            <input
                                type="checkbox"
                                name="competitionIds"
                                value={competition.id}
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={(event) => toggle(competition.id, event.target.checked)}
                                className="sr-only"
                            />
                            <CompetitionLogo competition={competition} className="size-7"/>
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-semibold text-white">{competition.name}</span>
                                {competition.countryName && <span className="text-[11px] text-muted">{competition.countryName}</span>}
                            </span>
                            {isSelected && <Check className="absolute top-1.5 right-2 size-3.5 text-primary" strokeWidth={3} aria-hidden/>}
                        </label>
                    );
                })}
            </div>

            {error && <p id="competitions-message" className="text-[11px] leading-4 text-danger">{error}</p>}
        </fieldset>
    );
}