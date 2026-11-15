import type { ActionFunctionArgs } from "react-router-dom";
import {
    DEFAULT_MULTIPLIERS,
    DEFAULT_POINT_REWARD,
    JOIN_CODE_LENGTH,
    JOIN_CODE_PATTERN,
    LEAGUE_MAX_COMPETITIONS,
    LEAGUE_MIN_COMPETITIONS,
    LEAGUE_NAME_MAX_LENGTH,
    LEAGUE_NAME_MIN_LENGTH,
    MULTIPLIER_FACTORS,
    MULTIPLIER_FINAL_MATCHDAYS,
    MULTIPLIER_TARGETS,
    POINT_REWARDS,
    SCORING_OPTIONS,
    SCORING_SETTINGS,
    STANDARD_SCORING,
    TEAM_NAME_MAX_LENGTH,
    TEAM_NAME_MIN_LENGTH,
    type MultiplierTarget,
    type ScoringSettings
} from "../config/league.constants";
import {
    createLeague,
    getLeagueSpanishErrorMessage,
    joinLeague,
    renameLeague,
    type CreateLeagueInput,
    type JoinedLeague
} from "../services/league.service";
import type { FormActionResult } from "./actions";

export type CreateLeagueField = 'name' | 'teamName' | 'competitionIds';
export type JoinLeagueField = 'joinCode' | 'teamName';
export type RenameLeagueField = 'name';

export interface JoinedLeagueActionResult<Field extends string> extends FormActionResult<Field> {
    joined?: JoinedLeague;
}

export interface RenameLeagueActionResult extends FormActionResult<RenameLeagueField> {
    renamed?: boolean;
}

/** Value of the scoring-mode radio of the create form. */
export const CUSTOM_SCORING_MODE = 'custom';
/** Prefix of the scoring selects of the create form (e.g. "scoring.assistPoints"). */
export const SCORING_FIELD_PREFIX = 'scoring.';

const LEAGUE_NAME_ERROR = `El nombre de la liga debe tener entre ${LEAGUE_NAME_MIN_LENGTH} y ${LEAGUE_NAME_MAX_LENGTH} caracteres.`;
const TEAM_NAME_ERROR = `El nombre del equipo debe tener entre ${TEAM_NAME_MIN_LENGTH} y ${TEAM_NAME_MAX_LENGTH} caracteres.`;

function readText(formData: FormData, field: string): string {
    const value = formData.get(field);
    return typeof value === 'string' ? value.trim() : '';
}

/** The number in the field when it is one of the allowed values, the fallback otherwise. */
function readOption<T extends number>(formData: FormData, field: string, allowed: readonly T[], fallback: T): T {
    const value = Number(formData.get(field));
    return allowed.includes(value as T) ? value as T : fallback;
}

function hasLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
}

function readScoring(formData: FormData): ScoringSettings {
    // With "Reglas estándar" the selects are not in the form: the standard values are used.
    if (formData.get('scoringMode') !== CUSTOM_SCORING_MODE) {
        return {...STANDARD_SCORING};
    }

    const scoring = {} as ScoringSettings;
    for (const setting of SCORING_SETTINGS) {
        scoring[setting] = readOption(
            formData, SCORING_FIELD_PREFIX + setting, SCORING_OPTIONS[setting], STANDARD_SCORING[setting]
        );
    }
    return scoring;
}

function readMultipliers(formData: FormData): CreateLeagueInput['multipliers'] {
    if (formData.get('multipliersEnabled') !== 'on') {
        return {enabled: false};
    }

    const target = readText(formData, 'multiplierTarget') as MultiplierTarget;
    return {
        enabled: true,
        finalMatchdays: readOption(formData, 'multiplierFinalMatchdays', MULTIPLIER_FINAL_MATCHDAYS, DEFAULT_MULTIPLIERS.finalMatchdays),
        factor: readOption(formData, 'multiplierFactor', MULTIPLIER_FACTORS, DEFAULT_MULTIPLIERS.factor),
        target: MULTIPLIER_TARGETS.includes(target) ? target : DEFAULT_MULTIPLIERS.target
    };
}

export async function createLeagueAction(
    {request}: ActionFunctionArgs
): Promise<JoinedLeagueActionResult<CreateLeagueField>> {
    const formData = await request.formData();
    const name = readText(formData, 'name');
    const teamName = readText(formData, 'teamName');
    const competitionIds = formData.getAll('competitionIds').map(Number).filter(Number.isInteger);

    const fieldErrors: Partial<Record<CreateLeagueField, string>> = {};
    if (!hasLength(name, LEAGUE_NAME_MIN_LENGTH, LEAGUE_NAME_MAX_LENGTH)) fieldErrors.name = LEAGUE_NAME_ERROR;
    if (teamName && !hasLength(teamName, TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH)) fieldErrors.teamName = TEAM_NAME_ERROR;
    if (competitionIds.length < LEAGUE_MIN_COMPETITIONS || competitionIds.length > LEAGUE_MAX_COMPETITIONS) {
        fieldErrors.competitionIds = `Elige entre ${LEAGUE_MIN_COMPETITIONS} y ${LEAGUE_MAX_COMPETITIONS} competiciones.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {fieldErrors};
    }

    try {
        const joined = await createLeague({
            name,
            teamName: teamName || undefined,
            competitionIds,
            scoring: readScoring(formData),
            pointReward: readOption(formData, 'pointReward', POINT_REWARDS, DEFAULT_POINT_REWARD),
            captainEnabled: formData.get('captainEnabled') === 'on',
            multipliers: readMultipliers(formData)
        });
        return {joined};
    } catch (error) {
        console.error('Failed to create the league', error);
        return {formError: getLeagueSpanishErrorMessage(error)};
    }
}

export async function joinLeagueAction(
    {request}: ActionFunctionArgs
): Promise<JoinedLeagueActionResult<JoinLeagueField>> {
    const formData = await request.formData();
    const joinCode = readText(formData, 'joinCode').toUpperCase();
    const teamName = readText(formData, 'teamName');

    const fieldErrors: Partial<Record<JoinLeagueField, string>> = {};
    if (!JOIN_CODE_PATTERN.test(joinCode)) {
        fieldErrors.joinCode = `El código debe tener ${JOIN_CODE_LENGTH} letras o números.`;
    }
    if (teamName && !hasLength(teamName, TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH)) fieldErrors.teamName = TEAM_NAME_ERROR;

    if (Object.keys(fieldErrors).length > 0) {
        return {fieldErrors};
    }

    try {
        return {joined: await joinLeague(joinCode, teamName || undefined)};
    } catch (error) {
        console.error('Failed to join the league', error);
        return {formError: getLeagueSpanishErrorMessage(error)};
    }
}

export async function renameLeagueAction({request, params}: ActionFunctionArgs): Promise<RenameLeagueActionResult> {
    const formData = await request.formData();
    const name = readText(formData, 'name');

    if (!hasLength(name, LEAGUE_NAME_MIN_LENGTH, LEAGUE_NAME_MAX_LENGTH)) {
        return {fieldErrors: {name: LEAGUE_NAME_ERROR}};
    }

    try {
        await renameLeague(Number(params.leagueId), name);
        // The page loader runs again after the action, so the new name and canRename = false are shown.
        return {renamed: true};
    } catch (error) {
        console.error('Failed to rename the league', error);
        return {formError: getLeagueSpanishErrorMessage(error)};
    }
}
