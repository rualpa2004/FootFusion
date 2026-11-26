import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../../../../src/components/layout/AppLayout';
import type { UserProfile } from '../../../../src/services/auth.service';
import { renderWithRouter } from '../../../helpers/render-with-router';

// The profile and the summary come from protectedLoader in the app; here they are fixed per test
const auth = vi.hoisted(() => ({profile: {} as UserProfile}));
vi.mock('../../../../src/hooks/useAuth', () => ({useAuth: () => ({profile: auth.profile})}));
vi.mock('../../../../src/hooks/useManagerSummary', () => ({useManagerSummary: () => ({globalRank: 12})}));

function renderLayout(role: UserProfile['role']) {
    auth.profile = {id: 1, name: 'ApexManager', email: 'apex@example.com', role, registerDate: '2026-09-15'};
    return renderWithRouter({path: '/home-test', element: <AppLayout/>});
}

describe('AppLayout', () => {
    it('links the user block of the sidebar and the mobile avatar to the profile of a manager', () => {
        // Expected: two links to /profile (sidebar block and mobile avatar).
        const {container} = renderLayout('USER');

        expect(container.querySelectorAll('a[href="/profile"]')).toHaveLength(2);
        expect(screen.getByRole('link', {name: 'Mi perfil'})).toBeInTheDocument();
    });

    it('shows who is signed in without any link to the profile for the administrator', () => {
        // Expected: the name still in the sidebar, but no link to /profile anywhere.
        const {container} = renderLayout('ADMIN');

        expect(screen.getByText('ApexManager')).toBeInTheDocument();
        expect(container.querySelectorAll('a[href="/profile"]')).toHaveLength(0);
    });
});
