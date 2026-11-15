import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LeagueDetailPage } from '../../../src/pages/LeagueDetailPage';
import type { LeagueDetail } from '../../../src/services/league.service';
import { LEAGUE_DETAIL, member } from '../../helpers/league-fixtures';
import { renderWithRouter } from '../../helpers/render-with-router';

// The logged-in user is the one with id 1 (second in LEAGUE_DETAIL.members).
vi.mock('../../../src/hooks/useAuth', () => ({useAuth: () => ({profile: {id: 1, name: 'Manager 1'}})}));
vi.mock('../../../src/hooks/useManagerSummary', () => ({useManagerSummary: () => ({globalRank: 1, currentGameweek: 24})}));

function renderPage(league: LeagueDetail = LEAGUE_DETAIL, action: ActionFunction = vi.fn(async () => ({renamed: true}))) {
    renderWithRouter({
        path: '/leagues/5',
        element: <LeagueDetailPage/>,
        loader: () => ({league, matchdays: [], selectedMatchday: null}),
        action
    });
    return {action};
}

describe('LeagueDetailPage', () => {
    it('shows the ranking with the current user marked', async () => {
        // Expected: 3 rows in backend order and the user's own row with "(Tú)" and aria-current.
        renderPage();

        const rows = within(await screen.findByRole('table')).getAllByRole('row').slice(1);
        expect(rows.map((row) => row.textContent)).toEqual([
            '#1Manager 2Equipo 230 pts',
            '#2Manager 1 (Tú)Equipo 120 pts',
            '#3Manager 3Equipo 310 pts'
        ]);
        expect(rows[1]).toHaveAttribute('aria-current', 'true');
    });

    it('shows the podium only when there are points', async () => {
        // Expected: podium with points; no podium in a league where everybody has 0 points.
        const {unmount} = renderWithRouter({
            path: '/leagues/5',
            element: <LeagueDetailPage/>,
            loader: () => ({league: LEAGUE_DETAIL, matchdays: [], selectedMatchday: null})
        });
        expect(await screen.findByRole('list', {name: 'Podio'})).toBeInTheDocument();
        unmount();

        renderPage({...LEAGUE_DETAIL, members: [member(1, 0), member(2, 0), member(3, 0)]});
        await screen.findByRole('table');
        expect(screen.queryByRole('list', {name: 'Podio'})).not.toBeInTheDocument();
    });

    it('offers only the season total while no matchday has been played', async () => {
        // Expected: a single "Total de la temporada" option and the "Aún no se ha disputado" notice.
        renderPage();

        const selector = await screen.findByRole('combobox', {name: 'Jornada'});
        expect(within(selector).getAllByRole('option').map((option) => option.textContent)).toEqual(['Total de la temporada']);
        expect(screen.getByText('Aún no se ha disputado ninguna jornada.')).toBeInTheDocument();
    });

    it('shows the invitation and the read-only settings', async () => {
        // Expected: the join code, the free places, 100.000 € per point, captain and multipliers off.
        renderPage();

        expect(await screen.findAllByText('A7KQ2M')).toHaveLength(2);   //Code and under the QR (closed)
        expect(screen.getByText(/Quedan 5 plazas/)).toBeInTheDocument();
        expect(screen.getByText('100.000 €')).toBeInTheDocument();
        expect(screen.getByText('Desactivado')).toBeInTheDocument();
        expect(screen.getByText('Desactivados')).toBeInTheDocument();
    });

    it('hides the rename button when the user cannot rename the league', async () => {
        // Expected: no "Cambiar nombre" button and no owner badge for a member.
        renderPage({...LEAGUE_DETAIL, isOwner: false, canRename: false});

        await screen.findByRole('table');
        expect(screen.queryByRole('button', {name: 'Cambiar nombre'})).not.toBeInTheDocument();
        expect(screen.queryByText('Propietario')).not.toBeInTheDocument();
    });

    it('renames the league from its dialog', async () => {
        // Expected: the dialog starts with the current name and the new name is sent to the action.
        const calls: string[] = [];
        const action = vi.fn(async ({request}: {request: Request}) => {
            calls.push(String((await request.formData()).get('name')));
            return {renamed: true};
        });
        renderPage(LEAGUE_DETAIL, action);

        await userEvent.click(await screen.findByRole('button', {name: 'Cambiar nombre'}));
        const input = screen.getByLabelText('Nuevo nombre');
        expect(input).toHaveValue('Liga de la Facultad');

        await userEvent.clear(input);
        await userEvent.type(input, 'Liga 2026');
        await userEvent.click(screen.getByRole('button', {name: /Guardar nombre/}));

        await waitFor(() => expect(calls).toEqual(['Liga 2026']));
    });
});
