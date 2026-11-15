// Join code of an invitation link (/leagues/join/:code) opened without a session. It is kept in
// sessionStorage (only this tab) while the user logs in or signs up, and used afterwards to open the
// join dialog already filled in.

const PENDING_JOIN_CODE_KEY = 'footfusion:pendingJoinCode';

export function savePendingJoinCode(code: string): void {
    try {
        sessionStorage.setItem(PENDING_JOIN_CODE_KEY, code.trim().toUpperCase());
    } catch (error) {
        // Storage can be unavailable: the user can still type the code in the join dialog.
        console.warn('Could not store the pending join code', error);
    }
}

/** Reads the pending join code (e.g. to show a notice on the login page). */
export function peekPendingJoinCode(): string | null {
    try {
        return sessionStorage.getItem(PENDING_JOIN_CODE_KEY) || null;
    } catch {
        return null;
    }
}

/** Returns the pending join code and removes it, so the join dialog is only opened once. */
export function consumePendingJoinCode(): string | null {
    const code = peekPendingJoinCode();
    try {
        sessionStorage.removeItem(PENDING_JOIN_CODE_KEY);
    } catch {
        // Nothing to remove when the storage is unavailable.
    }
    return code;
}

/** Page shown after logging in: the leagues page when an invitation is waiting, the dashboard otherwise. */
export function getPostLoginPath(): string {
    return peekPendingJoinCode() ? '/leagues' : '/home';
}
