import type { ActionFunctionArgs } from "react-router-dom";
import { getLineupSpanishErrorMessage, saveLineup, type Lineup, type SaveLineupInput } from "../services/team.service";

/** Body sent by the lineup editor: the lineup and the matchday the user was editing. */
export interface SaveLineupRequest extends SaveLineupInput {
    matchday: number;
}

export interface SaveLineupActionResult {
    saved?: Lineup;
    movedFrom?: number;
    formError?: string;
}

export async function saveLineupAction({request, params}: ActionFunctionArgs): Promise<SaveLineupActionResult> {
    const {matchday, ...lineup} = await request.json() as SaveLineupRequest;

    try {
        const saved = await saveLineup(Number(params.leagueId), lineup);
        return saved.matchday.number === matchday ? {saved} : {saved, movedFrom: matchday};
    } catch (error) {
        console.error('Failed to save the lineup', error);
        return {formError: getLineupSpanishErrorMessage(error)};
    }
}
