import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LeaguesPage } from '../../../src/pages/LeaguesPage';
import type { MyLeague } from '../../../src/services/league.service';
import { JOINED_LEAGUE, MY_LEAGUE } from '../../helpers/league-fixtures';
import { renderWithRouter } from '../../helpers/render-with-router';

vi.mock('../../../src/hooks/useManagerSummary', () => ({useManagerSummary: () => ({globalRank: 1, currentGameweek: 24})}));

function renderPage({
    leagues = [MY_LEAGUE],
    pendingJoinCode = null,
    action = vi.fn(async () => null)
}: {leagues?: MyLeague[]; pendingJoinCode?: string | null; action?: ActionFunction} = {}) {
    renderWithRouter({
        path: '/leagues',
        element: <LeaguesPage/>,
        loader: () => ({leagues, pendingJoinCode}),
        action,
        routes: [{path: '/leagues/new', element: <p>Create league page</p>}]
    });
    return {action};
}

describe('LeaguesPage', () => {
    it('shows a card for each league of the user', async () => {
        // Expected: the league name, its competitions, "5 / 8", the owner badge and the user's team.
        renderPage();

        const card = await screen.findByRole('link', {name: /Liga de la Facultad/});
        expect(card).toHaveAttribute('href', '/leagues/5');
        expect(card).toHaveTextContent('La Liga');
        expect(card).toHaveTextContent('5 / 8');
        expect(card).toHaveTextContent('Propietario');
        expect(card).toHaveTextContent('Los Galácticos');
        expect(card).toHaveTextContent('100.000.000 €');
    });

    it('shows the empty state when the user is in no league', async () => {
        // Expected: "Aún no estás en ninguna liga" with the create and join actions.
        renderPage({leagues: []});

        expect(await screen.findByRole('heading', {name: 'Aún no estás en ninguna liga'})).toBeInTheDocument();
        expect(screen.getByRole('link', {name: /Crear liga/})).toHaveAttribute('href', '/leagues/new');
        expect(screen.getByRole('button', {name: /Unirse con código/})).toBeInTheDocument();
    });

    it('opens the join dialog when the user clicks "Unirse con código"', async () => {
        // Expected: the "Unirse a una liga" dialog open with an empty code.
        renderPage();

        await userEvent.click(await screen.findByRole('button', {name: /Unirse con código/}));

        expect(screen.getByRole('dialog', {name: 'Unirse a una liga'})).toHaveAttribute('open');
        expect(screen.getByLabelText('Código de invitación')).toHaveValue('');
    });

    it('opens the join dialog filled in after an invitation link', async () => {
        // Expected: the dialog open by itself with the code "A7KQ2M" already typed.
        renderPage({pendingJoinCode: 'A7KQ2M'});

        await waitFor(() => expect(screen.getByRole('dialog', {name: 'Unirse a una liga'})).toHaveAttribute('open'));
        expect(screen.getByLabelText('Código de invitación')).toHaveValue('A7KQ2M');
    });

    it('shows the error of the action inside the dialog', async () => {
        // Expected: the "La liga está completa" alert inside the dialog.
        renderPage({action: vi.fn(async () => ({formError: 'La liga está completa: ya tiene 8 equipos.'}))});

        await userEvent.click(await screen.findByRole('button', {name: /Unirse con código/}));
        await userEvent.type(screen.getByLabelText('Código de invitación'), 'ZZZZZ9');
        await userEvent.click(screen.getByRole('button', {name: 'Unirse'}));

        expect(await screen.findByRole('alert')).toHaveTextContent('La liga está completa: ya tiene 8 equipos.');
        expect(screen.getByLabelText('Código de invitación')).toHaveValue('ZZZZZ9');
    });

    it('shows the squad reveal after joining', async () => {
        // Expected: the reveal of the new squad replaces the list.
        renderPage({action: vi.fn(async () => ({joined: JOINED_LEAGUE}))});

        await userEvent.click(await screen.findByRole('button', {name: /Unirse con código/}));
        await userEvent.type(screen.getByLabelText('Código de invitación'), 'A7KQ2M');
        await userEvent.click(screen.getByRole('button', {name: 'Unirse'}));

        expect(await screen.findByRole('heading', {name: /plantilla/})).toBeInTheDocument();
        expect(screen.queryByText('MIS LIGAS (1)')).not.toBeInTheDocument();
    });
});
