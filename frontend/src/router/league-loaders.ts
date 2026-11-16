import { data, redirect, type LoaderFunctionArgs } from "react-router-dom";
import { ApiError } from "../services/api.client";
import { getCompetitions, getLeague, getMyLeagues, getPlayedMatchdays } from "../services/league.service";
import { consumePendingJoinCode, savePendingJoinCode } from "./pending-join";

/** URL parameter of the standings matchday selector (/leagues/:id?jornada=5). */
export const MATCHDAY_PARAM = 'jornada';

export async function leaguesLoader() {
    const leagues = await getMyLeagues();
    const pendingJoinCode = consumePendingJoinCode();
    return {leagues, pendingJoinCode};
}

/**
 * Loader of the invitation link (/leagues/join/:code). It is outside the protected layout, so the code
 * is saved before any session check, and then sends the user to the leagues page, where the join
 * dialog opens filled in (after logging in when there was no session).
 */
export function joinLinkLoader({params}: LoaderFunctionArgs) {
    savePendingJoinCode(params.code ?? '');
    throw redirect('/leagues');
}

export async function createLeagueLoader() {
    return {competitions: await getCompetitions()};
}

export async function leagueDetailLoader({params, request}: LoaderFunctionArgs) {
    const leagueId = Number(params.leagueId);
    if (!Number.isInteger(leagueId) || leagueId <= 0) {
        throw data('League not found', {status: 404});
    }

    try {
        const [league, matchdays] = await Promise.all([getLeague(leagueId), getPlayedMatchdays(leagueId)]);
        const requestedMatchday = Number(new URL(request.url).searchParams.get(MATCHDAY_PARAM));
        const selectedMatchday = matchdays.includes(requestedMatchday) ? requestedMatchday : null;
        // TODO: when a matchday is selected, load the points of that matchday (scoring branch).
        return {league, matchdays, selectedMatchday};
    } catch (error) {
        // A league that does not exist and one the user is not a member of show the same "not found" page
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
            throw data('League not found', {status: 404});
        }
        throw error;
    }
}
