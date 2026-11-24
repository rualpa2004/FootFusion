// Last league the user opened, remembered in the browser so the "Alineación" item of the menu can open its lineup.
// localStorage (not sessionStorage): it is a convenience that should survive closing the tab.

const LAST_LEAGUE_KEY = 'footfusion:lastLeagueId';

export function rememberLastLeague(leagueId: number): void {
    try {
        localStorage.setItem(LAST_LEAGUE_KEY, String(leagueId));
    } catch (error) {
        // Storage can be unavailable (e.g. blocked by the browser): the menu then opens the list of leagues.
        console.warn('Could not store the last opened league', error);
    }
}

/** Id of the last league opened, or null when there is none (or it can not be read). */
export function readLastLeague(): number | null {
    try {
        const leagueId = Number(localStorage.getItem(LAST_LEAGUE_KEY));
        return Number.isInteger(leagueId) && leagueId > 0 ? leagueId : null;
    } catch (error) {
        console.warn('Could not read the last opened league', error);
        return null;
    }
}

export function forgetLastLeague(): void {
    try {
        localStorage.removeItem(LAST_LEAGUE_KEY);
    } catch (error) {
        console.warn('Could not remove the last opened league', error);
    }
}
