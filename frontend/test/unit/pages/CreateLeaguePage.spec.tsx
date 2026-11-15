import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CreateLeaguePage } from '../../../src/pages/CreateLeaguePage';
import { COMPETITIONS, JOINED_LEAGUE } from '../../helpers/league-fixtures';
import { renderWithRouter } from '../../helpers/render-with-router';

// The real Firebase app is never initialised: without the .env keys (e.g. in GitHub Actions) it throws
// auth/invalid-api-key as soon as api.client imports it.
vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

// Data of the protected layout (profile, gameweek) used by the page and its header.
vi.mock('../../../src/hooks/useAuth', () => ({useAuth: () => ({profile: {id: 1, name: 'ApexManager'}})}));
vi.mock('../../../src/hooks/useManagerSummary', () => ({useManagerSummary: () => ({globalRank: 1, currentGameweek: 24})}));

function renderPage(action: ActionFunction = vi.fn(async () => null)) {
    renderWithRouter({
        path: '/leagues/new',
        element: <CreateLeaguePage/>,
        loader: () => ({competitions: COMPETITIONS}),
        action
    });
}

/** Action double that records every value of the submitted form. */
function recordingAction(result: unknown = null) {
    const calls: [string, FormDataEntryValue][][] = [];
    const action = vi.fn(async ({request}: {request: Request}) => {
        calls.push([...(await request.formData()).entries()]);
        return result;
    });
    return {action, calls};
}

describe('CreateLeaguePage', () => {
    it('starts with 100.000 € per point, no captain and no multipliers', async () => {
        // Expected: the 100.000 € option checked and both switches off.
        renderPage();

        expect(await screen.findByRole('radio', {name: '100.000 €'})).toBeChecked();
        expect(screen.getByRole('switch', {name: /Capitán/})).not.toBeChecked();
        expect(screen.getByRole('switch', {name: /Multiplicadores/})).not.toBeChecked();
        expect(screen.queryByRole('group', {name: 'Últimas jornadas'})).not.toBeInTheDocument();
    });

    it('shows the multiplier options with 3 matchdays, x2 and relegation when they are enabled', async () => {
        // Expected: the options appear with "3", "x2" and "Descenso" checked.
        renderPage();

        await userEvent.click(await screen.findByRole('switch', {name: /Multiplicadores/}));

        expect(within(screen.getByRole('group', {name: 'Últimas jornadas'})).getByRole('radio', {name: '3'})).toBeChecked();
        expect(screen.getByRole('radio', {name: 'x2'})).toBeChecked();
        expect(screen.getByRole('radio', {name: 'Descenso'})).toBeChecked();
    });

    it('does not let the user choose more than 3 competitions', async () => {
        // Expected: after choosing 3, the fourth competition is disabled and the counter shows "3 / 3".
        renderPage();

        await userEvent.click(await screen.findByRole('checkbox', {name: /La Liga/}));
        await userEvent.click(screen.getByRole('checkbox', {name: /Premier League/}));
        await userEvent.click(screen.getByRole('checkbox', {name: /Serie A/}));

        expect(screen.getByRole('checkbox', {name: /Bundesliga/})).toBeDisabled();
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('fills the custom scoring with the standard values and can reset them', async () => {
        // Expected: the selects start with the standard values; after a change, "Restablecer" brings them back.
        renderPage();

        await userEvent.click(await screen.findByRole('radio', {name: /Personalizada/}));
        const goalSelect = screen.getByRole('combobox', {name: 'Gol (delantero)'});
        expect(goalSelect).toHaveValue('4');
        expect(screen.getByRole('combobox', {name: 'Minutos jugados'})).toHaveValue('2');

        await userEvent.selectOptions(goalSelect, '5');
        expect(goalSelect).toHaveValue('5');

        await userEvent.click(screen.getByRole('button', {name: /Restablecer valores estándar/}));
        expect(goalSelect).toHaveValue('4');
    });

    it('submits the chosen values to the action', async () => {
        // Expected: the form sends the name, the chosen competitions, the scoring mode and the point reward.
        const {action, calls} = recordingAction();
        renderPage(action);

        await userEvent.type(await screen.findByLabelText('Nombre de la liga'), 'Liga de la Facultad');
        await userEvent.click(screen.getByRole('checkbox', {name: /La Liga/}));
        await userEvent.click(screen.getByRole('radio', {name: '300.000 €'}));
        await userEvent.click(screen.getByRole('button', {name: 'CREAR LIGA'}));

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        const fields = calls[0]!;
        expect(fields).toContainEqual(['name', 'Liga de la Facultad']);
        expect(fields).toContainEqual(['competitionIds', '119924']);
        expect(fields).toContainEqual(['scoringMode', 'standard']);
        expect(fields).toContainEqual(['pointReward', '300000']);
        expect(fields.map(([name]) => name)).not.toContain('captainEnabled');
        expect(fields.map(([name]) => name)).not.toContain('multipliersEnabled');
    });

    it('shows the errors returned by the action', async () => {
        // Expected: the field error under the name and the server error as an alert.
        const action = vi.fn(async () => ({
            fieldErrors: {name: 'El nombre de la liga debe tener entre 3 y 30 caracteres.'},
            formError: 'Alguna de las competiciones elegidas no existe.'
        }));
        renderPage(action);

        await userEvent.click(await screen.findByRole('button', {name: 'CREAR LIGA'}));

        expect(await screen.findByText('El nombre de la liga debe tener entre 3 y 30 caracteres.')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Alguna de las competiciones elegidas no existe.');
    });

    it('replaces the form with the squad reveal after creating the league', async () => {
        // Expected: the "Tu plantilla inicial" reveal instead of the form.
        renderPage(vi.fn(async () => ({joined: JOINED_LEAGUE})));

        await userEvent.click(await screen.findByRole('button', {name: 'CREAR LIGA'}));

        expect(await screen.findByRole('heading', {name: /plantilla/})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'CREAR LIGA'})).not.toBeInTheDocument();
    });
});
