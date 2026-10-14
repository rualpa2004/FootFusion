// Runs before every test file (configured in vite.config.ts -> test.setupFiles).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    // Unmounts the components rendered by the previous test so tests do not affect each other.
    cleanup();
    // Resets calls and implementations of every mock and restores spies (e.g. on console.error),
    // so each test configures its own doubles from scratch.
    vi.resetAllMocks();
    vi.restoreAllMocks();
    sessionStorage.clear();
});
