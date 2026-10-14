// One-time messages passed between routes through sessionStorage instead of the URL,
// so they disappear after being read and cannot be bookmarked, shared or shown again on reload.

const REGISTERED_FLASH_KEY = 'footfusion:justRegistered';

/** Marks that an account was just created, so the login page can show the confirmation once. */
export function setRegisteredFlash(): void {
    try {
        sessionStorage.setItem(REGISTERED_FLASH_KEY, '1');
    } catch (error) {
        // Storage can be unavailable (e.g. blocked by the browser): the message is optional, so it is skipped.
        console.warn('Could not store the registered flash message', error);
    }
}

/** Returns whether the "account created" message must be shown and removes it, so it is only shown once. */
export function consumeRegisteredFlash(): boolean {
    try {
        const isSet = sessionStorage.getItem(REGISTERED_FLASH_KEY) === '1';
        sessionStorage.removeItem(REGISTERED_FLASH_KEY);
        return isSet;
    } catch (error) {
        console.warn('Could not read the registered flash message', error);
        return false;
    }
}
