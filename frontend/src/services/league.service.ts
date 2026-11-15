import type { MultiplierTarget, PositionGroup, ScoringSettings } from "../config/league.constants";
import { ApiError, apiRequest } from "./api.client";

// Types of the league endpoints

export interface Competition {
    id: number;
    name: string;
    logo?: string;
    countryName?: string;
}

export interface FantasyTeam {
    id: number;
    name: string;
    budget: number;
    totalPoints: number;
}

/** A league in the list of the user's leagues. */
export interface MyLeague {
    id: number;
    name: string;
    competitions: Competition[];
    membersCount: number;
    maxTeams: number;
    isOwner: boolean;
    team: FantasyTeam;
}

export interface LeagueMember {
    teamId: number;
    teamName: string;
    userId: number;
    userName: string;
    totalPoints: number;
}

export interface LeagueMultipliers {
    enabled: boolean;
    finalMatchdays: number | null;
    factor: number | null;
    target: MultiplierTarget | null;
}

/** Whole league, only for its members. Members come ordered by points. */
export interface LeagueDetail {
    id: number;
    name: string;
    joinCode: string;
    ownerId: number;
    isOwner: boolean;
    canRename: boolean;
    createdAt: string;
    initialBudget: number;
    maxTeams: number;
    pointReward: number;
    captainEnabled: boolean;
    multipliers: LeagueMultipliers;
    scoring: ScoringSettings | null;
    competitions: Competition[];
    members: LeagueMember[];
}

export interface SquadPlayer {
    playerPropertyId: number;
    externalPlayerId: number;
    name: string;
    photo?: string;
    positionGroup?: PositionGroup;
    teamName?: string;
    teamLogo?: string;
    marketValue: number;
    clauseValue: number;
}

/** Response of creating or joining a league: the league, the user's new team and its initial squad. */
export interface JoinedLeague {
    league: {id: number; name: string; joinCode: string};
    team: FantasyTeam;
    squad: SquadPlayer[];
}

export interface CreateLeagueInput {
    name: string;
    teamName?: string;
    competitionIds: number[];
    scoring: ScoringSettings;
    pointReward: number;
    captainEnabled: boolean;
    multipliers: {
        enabled: boolean;
        finalMatchdays?: number;
        factor?: number;
        target?: MultiplierTarget;
    };
}

const UNEXPECTED_ERROR_MESSAGE = 'Ha ocurrido un error inesperado.';

const LEAGUE_ERROR_MESSAGES: Record<string, string> = {
    'Unknown competition': 'Alguna de las competiciones elegidas no existe.',
    'League not found': 'No existe ninguna liga con ese código.',
    'The user was expelled from this league': 'Fuiste expulsado de esta liga y no puedes volver a unirte.',
    'The user is already a member of this league': 'Ya formas parte de esta liga.',
    'The league is full': 'La liga está completa: ya tiene 8 equipos.',
    'Only the owner can rename the league': 'Solo el propietario puede cambiar el nombre de la liga.',
    'The league has already been renamed': 'El nombre de la liga ya se cambió una vez.',
    'The user is banned': 'Tu cuenta está bloqueada.'
};

/** Spanish message for an error thrown by the league requests. */
export function getLeagueSpanishErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.message.startsWith('Not enough free agents')) {
            return 'No quedan suficientes jugadores libres para formar tu plantilla.';
        }
        return LEAGUE_ERROR_MESSAGES[error.message] ?? UNEXPECTED_ERROR_MESSAGE;
    }
    return UNEXPECTED_ERROR_MESSAGE;
}

export function getCompetitions(): Promise<Competition[]> {
    return apiRequest<Competition[]>('/competitions');
}

export function getMyLeagues(): Promise<MyLeague[]> {
    return apiRequest<MyLeague[]>('/leagues');
}

export function getLeague(leagueId: number): Promise<LeagueDetail> {
    return apiRequest<LeagueDetail>(`/leagues/${leagueId}`);
}

export function createLeague(input: CreateLeagueInput): Promise<JoinedLeague> {
    return apiRequest<JoinedLeague>('/leagues', {method: 'POST', body: JSON.stringify(input)});
}

export function joinLeague(joinCode: string, teamName?: string): Promise<JoinedLeague> {
    return apiRequest<JoinedLeague>('/leagues/join', {method: 'POST', body: JSON.stringify({joinCode, teamName})});
}

export function renameLeague(leagueId: number, name: string): Promise<LeagueDetail> {
    return apiRequest<LeagueDetail>(`/leagues/${leagueId}/name`, {method: 'PATCH', body: JSON.stringify({name})});
}

/**
 * Matchdays already played in the league, for the standings selector.
 * TODO: the backend has no matchdays yet (scoring branch). When it has, request them here and add the
 * request of the points of one matchday, used by leagueDetailLoader when a matchday is selected.
 */
export async function getPlayedMatchdays(_leagueId: number): Promise<number[]> {
    return [];
}
