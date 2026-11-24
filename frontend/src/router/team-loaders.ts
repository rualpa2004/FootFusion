import { data, redirect, type LoaderFunctionArgs } from "react-router-dom";
import { ApiError } from "../services/api.client";
import { getMyLeagues } from "../services/league.service";
import { getLineup, getTeam, type Lineup } from "../services/team.service";
import { forgetLastLeague, readLastLeague, rememberLastLeague } from "./last-league";
import { MATCHDAY_PARAM } from "./league-loaders";

function notFound(): never {
    throw data('Team not found', {status: 404});
}

function positiveInteger(value: string | null | undefined): number | null {
    const number = Number(value);
    return value && Number.isInteger(number) && number > 0 ? number : null;
}

async function findLineup(leagueId: number, teamId: number, matchday: number | null): Promise<Lineup | null> {
    try {
        return await getLineup(leagueId, teamId, matchday ?? undefined);
    } catch (error) {
        if (error instanceof ApiError && error.status === 400 && matchday !== null) {
            return findLineup(leagueId, teamId, null);
        }
        if (error instanceof ApiError && error.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function teamLoader({params, request}: LoaderFunctionArgs) {
    const leagueId = positiveInteger(params.leagueId) ?? notFound();
    const myLeague = (await getMyLeagues()).find((league) => league.id === leagueId);
    if (!myLeague) {
        // Not a member (or the league does not exist): the menu shortcut must not open it again
        if (readLastLeague() === leagueId) forgetLastLeague();
        notFound();
    }

    const teamId = params.teamId === undefined ? myLeague.team.id : positiveInteger(params.teamId) ?? notFound();
    const matchday = positiveInteger(new URL(request.url).searchParams.get(MATCHDAY_PARAM));

    try {
        const [team, lineup] = await Promise.all([getTeam(leagueId, teamId), findLineup(leagueId, teamId, matchday)]);
        rememberLastLeague(leagueId);
        return {league: {id: myLeague.id, name: myLeague.name}, team, lineup};
    } catch (error) {
        // A team of another league shows the same "not found" page
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
            notFound();
        }
        throw error;
    }
}

/** "Alineación" item of the menu: the lineup of the last league opened, or the list of leagues when there is none. */
export function lineupShortcutLoader() {
    const leagueId = readLastLeague();
    throw redirect(leagueId === null ? '/leagues' : `/leagues/${leagueId}/team`);
}
