// One-time messages passed between routes through sessionStorage instead of the URL,
// so they disappear after being read and cannot be bookmarked, shared or shown again on reload.

const REGISTERED_FLASH_KEY = 'footfusion:justRegistered';

/** Marks that an account was just created, so the login page can show the confirmation once. */
export function setRegisteredFlash(maskedEmail: string): void {
    try {
        sessionStorage.setItem(REGISTERED_FLASH_KEY, maskedEmail);
    } catch (error) {
        // Storage can be unavailable (e.g. blocked by the browser): the message is optional, so it is skipped.
        console.warn('Could not store the registered flash message', error);
    }
}

/** Returns the masked email of the account just created (null when there is no message to show) and removes it, so the message is only shown once. */
export function consumeRegisteredFlash(): string | null {
    try {
        const maskedEmail = sessionStorage.getItem(REGISTERED_FLASH_KEY);
        sessionStorage.removeItem(REGISTERED_FLASH_KEY);
        return maskedEmail || null;
    } catch (error) {
        console.warn('Could not read the registered flash message', error);
        return null;
    }
}
