// Runs before every test file (configured in vite.config.ts -> test.setupFiles).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom does not implement the modal methods of <dialog> (real browsers do). This minimal version only
// toggles the "open" attribute, which is enough to test components that open and close dialogs.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
}
if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    };
}

afterEach(() => {
    // Unmounts the components rendered by the previous test so tests do not affect each other.
    cleanup();
    // Resets calls and implementations of every mock and restores spies (e.g. on console.error),
    // so each test configures its own doubles from scratch.
    vi.resetAllMocks();
    vi.restoreAllMocks();
    sessionStorage.clear();
});
