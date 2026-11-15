import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { FormAlert } from "../components/form/FormAlert";
import { FormField } from "../components/form/FormField";
import { SegmentedControl } from "../components/form/SegmentedControl";
import { TextInput } from "../components/form/TextInput";
import { ToggleRow } from "../components/form/ToggleRow";
import { PageHeader } from "../components/layout/PageHeader";
import { CompetitionPicker } from "../components/league/CompetitionPicker";
import { ScoringFieldset } from "../components/league/ScoringFieldset";
import { SquadReveal } from "../components/league/SquadReveal";
import {
    DEFAULT_MULTIPLIERS,
    DEFAULT_POINT_REWARD,
    LEAGUE_INITIAL_BUDGET,
    LEAGUE_MAX_TEAMS,
    LEAGUE_NAME_MAX_LENGTH,
    LEAGUE_NAME_MIN_LENGTH,
    MULTIPLIER_FACTORS,
    MULTIPLIER_FINAL_MATCHDAYS,
    MULTIPLIER_TARGET_LABELS,
    MULTIPLIER_TARGETS,
    POINT_REWARDS,
    SQUAD_SIZE,
    TEAM_NAME_MAX_LENGTH
} from "../config/league.constants";
import { useAuth } from "../hooks/useAuth";
import type { createLeagueAction } from "../router/league-actions";
import type { createLeagueLoader } from "../router/league-loaders";
import { formatEuros } from "../utils/format";

const PANEL_CLASSES = 'flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6';

export function CreateLeaguePage() {
    const {competitions} = useLoaderData<typeof createLeagueLoader>();
    const actionData = useActionData<typeof createLeagueAction>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    const {profile} = useAuth();
    // Shows the options of the multipliers only while they are enabled.
    const [multipliersEnabled, setMultipliersEnabled] = useState(false);

    // After a successful creation the action returns the squad: the reveal replaces the form.
    if (actionData?.joined) {
        return <SquadReveal joined={actionData.joined} showInvite/>;
    }

    const fieldErrors = actionData?.fieldErrors;

    return (
        <>
            <Link to="/leagues" className="flex items-center gap-1.5 self-start text-[13px] text-muted hover:text-white">
                <ChevronLeft className="size-4" aria-hidden/>Volver a mis ligas
            </Link>
            <PageHeader title="Crear liga" subtitle="Configura tu liga y compite con tus amigos"/>

            <Form method="post" noValidate className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="flex min-w-0 flex-col gap-5">
                    <section className={PANEL_CLASSES}>
                        <h2 className="font-display text-lg font-bold text-white">DATOS DE LA LIGA</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                label="Nombre de la liga"
                                htmlFor="name"
                                error={fieldErrors?.name}
                                hint={`Entre ${LEAGUE_NAME_MIN_LENGTH} y ${LEAGUE_NAME_MAX_LENGTH} caracteres. Podrás cambiarlo una sola vez.`}
                            >
                                <TextInput
                                    id="name"
                                    name="name"
                                    icon={Trophy}
                                    maxLength={LEAGUE_NAME_MAX_LENGTH}
                                    placeholder="Ej.: Liga de la Facultad"
                                    hasError={Boolean(fieldErrors?.name)}
                                />
                            </FormField>
                            <FormField
                                label="Nombre de tu equipo (opcional)"
                                htmlFor="teamName"
                                error={fieldErrors?.teamName}
                                hint="Si lo dejas vacío se usará tu nombre de mánager."
                            >
                                <TextInput
                                    id="teamName"
                                    name="teamName"
                                    icon={Trophy}
                                    maxLength={TEAM_NAME_MAX_LENGTH}
                                    placeholder={profile.name}
                                    hasError={Boolean(fieldErrors?.teamName)}
                                />
                            </FormField>
                        </div>
                    </section>

                    <section className={PANEL_CLASSES}>
                        <CompetitionPicker competitions={competitions} error={fieldErrors?.competitionIds}/>
                    </section>

                    <section className={PANEL_CLASSES}>
                        <ScoringFieldset/>
                    </section>
                </div>

                <section className={PANEL_CLASSES}>
                    <h2 className="font-display text-lg font-bold text-white">REGLAS DE LA LIGA</h2>
                    {actionData?.formError && <FormAlert variant="error">{actionData.formError}</FormAlert>}

                    <SegmentedControl
                        name="pointReward"
                        legend="Dinero por punto al final de cada jornada"
                        options={POINT_REWARDS.map((reward) => ({value: reward, label: formatEuros(reward)}))}
                        defaultValue={DEFAULT_POINT_REWARD}
                    />

                    <ToggleRow
                        name="captainEnabled"
                        label="Capitán"
                        hint="Cada jornada eliges un capitán que puntúa doble."
                    />

                    <ToggleRow
                        name="multipliersEnabled"
                        label="Multiplicadores en las últimas jornadas"
                        hint="Premian a los equipos de abajo en el tramo final."
                        checked={multipliersEnabled}
                        onChange={(event) => setMultipliersEnabled(event.target.checked)}
                    >
                        {multipliersEnabled && (
                            <div className="flex flex-col gap-3 rounded-b-[10px] border border-t-0 border-line bg-[#0B1019] p-3.5">
                                <SegmentedControl
                                    name="multiplierFinalMatchdays"
                                    legend="Últimas jornadas"
                                    options={MULTIPLIER_FINAL_MATCHDAYS.map((value) => ({value, label: String(value)}))}
                                    defaultValue={DEFAULT_MULTIPLIERS.finalMatchdays}
                                />
                                <SegmentedControl
                                    name="multiplierFactor"
                                    legend="Factor"
                                    options={MULTIPLIER_FACTORS.map((value) => ({value, label: `x${value}`}))}
                                    defaultValue={DEFAULT_MULTIPLIERS.factor}
                                />
                                <SegmentedControl
                                    name="multiplierTarget"
                                    legend="Se aplica a"
                                    options={MULTIPLIER_TARGETS.map((value) => ({value, label: MULTIPLIER_TARGET_LABELS[value]}))}
                                    defaultValue={DEFAULT_MULTIPLIERS.target}
                                />
                                <p className="text-[11px] leading-4 text-muted">
                                    Solo afecta a los puntos positivos: la zona de descenso los multiplica por el factor y
                                    la zona de Champions los divide. Los negativos no cambian.
                                </p>
                            </div>
                        )}
                    </ToggleRow>

                    <dl className="flex flex-col gap-2.5 text-[13px]">
                        <div className="flex justify-between"><dt className="text-muted">Máximo de equipos</dt><dd className="font-bold text-white">{LEAGUE_MAX_TEAMS}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted">Presupuesto inicial</dt><dd className="font-bold text-white">{formatEuros(LEAGUE_INITIAL_BUDGET)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted">Plantilla inicial</dt><dd className="font-bold text-white">{SQUAD_SIZE} jugadores</dd></div>
                    </dl>

                    <p className="flex gap-2 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2.5 text-[11.5px] leading-[1.5] text-[#FBE7A1]">
                        <Lock className="size-4 shrink-0 text-warning" aria-hidden/>
                        <span>
                            La puntuación, el dinero por punto, el capitán y los multiplicadores <b className="text-white">no se podrán
                            cambiar</b> después de crear la liga.
                        </span>
                    </p>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-primary font-display text-base font-extrabold text-background shadow-[0_4px_12px_rgba(0,255,102,.25)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trophy className="size-4" aria-hidden/>
                        {isSubmitting ? 'Creando liga...' : 'CREAR LIGA'}
                    </button>
                </section>
            </Form>
        </>
    );
}
