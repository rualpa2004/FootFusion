import { ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import {
    SCORING_LABELS,
    SCORING_OPTIONS,
    SCORING_SETTINGS,
    STANDARD_SCORING,
    type ScoringSettings
} from "../../config/league.constants";
import { CUSTOM_SCORING_MODE, SCORING_FIELD_PREFIX } from "../../router/league-actions";
import { formatScoringValue } from "../../utils/league";
import { SECONDARY_BUTTON_CLASSES } from "../form/button-styles";

type ScoringMode = 'standard' | typeof CUSTOM_SCORING_MODE;

const MODES: {value: ScoringMode; title: string; description: string}[] = [
    {value: 'standard', title: 'Reglas estándar', description: 'Valores intermedios de cada rango. Recomendado si es tu primera liga.'},
    {value: CUSTOM_SCORING_MODE, title: 'Personalizada', description: 'Ajusta goles, asistencias, porterías a cero, tarjetas, duelos y faltas.'}
];

export function ScoringSummary({scoring}: {scoring: ScoringSettings}) {
    return (
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-lg bg-background p-3 text-xs sm:grid-cols-[1fr_auto_1fr_auto]">
            {SCORING_SETTINGS.map((setting) => (
                <div key={setting} className="contents">
                    <dt className="text-muted">{SCORING_LABELS[setting].label}</dt>
                    <dd className="text-right font-bold text-white">{formatScoringValue(setting, scoring[setting])}</dd>
                </div>
            ))}
        </dl>
    );
}

export function ScoringFieldset() {
    const [mode, setMode] = useState<ScoringMode>('standard');
    const [values, setValues] = useState<ScoringSettings>(STANDARD_SCORING);

    function selectMode(newMode: ScoringMode) {
        setMode(newMode);
        if (newMode === 'standard') {
            setValues(STANDARD_SCORING);
        }
    }

    return (
        <fieldset className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <legend className="font-display text-lg font-bold text-white">SISTEMA DE PUNTUACIÓN</legend>
                <p className="text-xs text-muted">Define cuántos puntos da o quita cada acción de los jugadores.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MODES.map((option) => (
                    <label
                        key={option.value}
                        className="flex cursor-pointer flex-col gap-1.5 rounded-[10px] border border-line bg-background p-4 has-checked:border-primary has-focus-visible:outline-2 has-focus-visible:outline-primary"
                    >
                        <input
                            type="radio"
                            name="scoringMode"
                            value={option.value}
                            checked={mode === option.value}
                            onChange={() => selectMode(option.value)}
                            className="sr-only"
                        />
                        <span className="font-display text-sm font-bold text-white">{option.title}</span>
                        <span className="text-[11px] leading-[1.5] text-muted">{option.description}</span>
                    </label>
                ))}
            </div>

            {mode === 'standard' ? (
                <ScoringSummary scoring={STANDARD_SCORING}/>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        {SCORING_SETTINGS.map((setting) => {
                            const id = `scoring-${setting}`;
                            const isChanged = values[setting] !== STANDARD_SCORING[setting];
                            const {label, hint} = SCORING_LABELS[setting];

                            return (
                                <div key={setting} className="flex flex-col gap-1.5">
                                    <label htmlFor={id} className="text-xs font-semibold text-text">{label}</label>
                                    <div className="relative">
                                        <select
                                            id={id}
                                            name={SCORING_FIELD_PREFIX + setting}
                                            value={values[setting]}
                                            onChange={(event) => setValues({...values, [setting]: Number(event.target.value)})}
                                            className={`h-10 w-full appearance-none rounded-lg border bg-background pr-9 pl-3 text-[13px] text-white outline-none focus:border-primary ${
                                                isChanged ? 'border-primary' : 'border-line-strong'
                                            }`}
                                        >
                                            {SCORING_OPTIONS[setting].map((value) => (
                                                <option key={value} value={value}>{formatScoringValue(setting, value)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 size-4 text-muted" aria-hidden/>
                                    </div>
                                    {hint && <p className="text-[10.5px] leading-4 text-muted">{hint}</p>}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[11px] text-muted">
                            Tiros a puerta, pases clave, paradas y regates puntúan siempre igual y no se configuran.
                        </p>
                        <button type="button" onClick={() => setValues(STANDARD_SCORING)} className={SECONDARY_BUTTON_CLASSES}>
                            <RotateCcw className="size-4" aria-hidden/>Restablecer valores estándar
                        </button>
                    </div>
                </>
            )}
        </fieldset>
    );
}
