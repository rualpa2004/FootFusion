import { PITCH_ROWS } from "../../config/league.constants";
import { FORMATION_NAMES, type Formation } from "../../config/lineup.constants";
import { canCover, formationShape, type PositionCounts } from "../../utils/lineup";

interface FormationPickerProps {
    value: Formation;
    squadCounts: PositionCounts;
    onChange: (formation: Formation) => void;
}

function dotClasses(squadCanFill: boolean, isOn: boolean): string {
    if (!squadCanFill) return 'bg-transparent shadow-[inset_0_0_0_1px_var(--color-warning)]';
    return isOn ? 'bg-primary' : 'bg-muted';
}

//The 9 formations as small pitches. The dots the squad can not fill have a dashed yellow border, but every formation can be chosen (marking those slots as empty)
export function FormationPicker({value, squadCounts, onChange}: Readonly<FormationPickerProps>) {
    return (
        <fieldset>
            <legend className="sr-only">Formación</legend>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
                {FORMATION_NAMES.map((formation) => {
                    const shape = formationShape(formation);
                    const isOn = formation === value;
                    return (
                        <label
                            key={formation}
                            title={canCover(formation, squadCounts) ? undefined : 'Tu plantilla no puede completar esta formación'}
                            className={`flex w-14 shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-1 py-1.5 text-[11px] font-bold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primary ${
                                isOn ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-background text-muted hover:border-line-strong'
                            }`}
                        >
                            <input
                                type="radio"
                                name="formation"
                                value={formation}
                                checked={isOn}
                                onChange={() => onChange(formation)}
                                className="sr-only"
                            />
                            <span aria-hidden className="flex h-[58px] w-11 flex-col justify-around rounded border border-primary/15 bg-[#0D1A13] px-px py-1">
                                {PITCH_ROWS.map((position) => (
                                    <span key={position} className="flex justify-evenly">
                                        {Array.from({length: shape[position]}, (_, index) => (
                                            <span
                                                key={index}
                                                className={`block size-1.5 rounded-full ${dotClasses(index < squadCounts[position], isOn)}`}
                                            />
                                        ))}
                                    </span>
                                ))}
                            </span>
                            {formation}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
