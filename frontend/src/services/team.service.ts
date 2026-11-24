import { ApiError, apiRequest } from "./api.client";
import type { SquadPlayer } from "./league.service";

// Types of the team and lineup endpoints

export interface TeamPlayer extends SquadPlayer {
    acquiredAt: string | null;
}

export interface TeamDetail {
    id: number;
    name: string;
    userId: number;
    userName: string;
    isMine: boolean;
    rank: number;
    totalPoints: number;
    budget: number | null;  //null if is not your own squad
    playersCount: number;
    maxPlayers: number;
    squad: TeamPlayer[];
}

export type MatchdayStatus = 'CLOSED' | 'LIVE' | 'UPCOMING';    //Applied to all matchday, not individual matches

export interface Matchday {
    number: number;
    locksAt: string;                //date of the first match of the matchday
    endsAt: string;
    status: MatchdayStatus;
}

export interface LineupStarter {
    slot: string;
    playerPropertyId: number;
}

export interface Lineup {
    teamId: number;
    matchday: Matchday;
    formation: string;
    players: LineupStarter[];
    captainId: number | null;
    captainEnabled: boolean;
    editable: boolean;              //true if the matchday has not started
    matchdays: Matchday[];          //matchdays can be checked
}

export interface SaveLineupInput {
    formation: string;
    players: LineupStarter[];
    captainId: number | null;
}

const UNEXPECTED_ERROR_MESSAGE = 'Ha ocurrido un error inesperado.';

const TEAM_ERROR_MESSAGES: Record<string, string> = {
    'The season has ended': 'La temporada ha terminado: ya no se pueden cambiar las alineaciones.',
    'The league has no captain': 'Esta liga no tiene capitán.',
    'The captain must be a starter': 'El capitán tiene que ser uno de los titulares.'
};

/** Spanish message for an error thrown by the lineup requests. */
export function getLineupSpanishErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return UNEXPECTED_ERROR_MESSAGE;
    }
    if (error.message.includes('is not in the squad')) {
        return 'Alguno de los jugadores ya no está en tu plantilla. Recarga la página.';
    }
    if (error.message.includes('can not play as')) {
        return 'Algún jugador está en una posición que no es la suya.';
    }
    return TEAM_ERROR_MESSAGES[error.message] ?? UNEXPECTED_ERROR_MESSAGE;
}

export function getTeam(leagueId: number, teamId: number): Promise<TeamDetail> {
    return apiRequest<TeamDetail>(`/leagues/${leagueId}/teams/${teamId}`);
}

/** Lineup of a team on a matchday; without matchday, the next one to be played. */
export function getLineup(leagueId: number, teamId: number, matchday?: number): Promise<Lineup> {
    const query = matchday === undefined ? '' : `?matchday=${matchday}`;
    return apiRequest<Lineup>(`/leagues/${leagueId}/teams/${teamId}/lineup${query}`);
}

/** Saves the user's lineup for the next matchday. The response says which matchday it was saved for. */
export function saveLineup(leagueId: number, input: SaveLineupInput): Promise<Lineup> {
    return apiRequest<Lineup>(`/leagues/${leagueId}/lineup`, {method: 'PUT', body: JSON.stringify(input)});
}
