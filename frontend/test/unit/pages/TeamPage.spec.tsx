import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeamPage } from '../../../src/pages/TeamPage';
import type { Lineup, TeamDetail } from '../../../src/services/team.service';
import { renderWithRouter } from '../../helpers/render-with-router';
import { MATCHDAY_12, MY_LINEUP, MY_TEAM, OTHER_TEAM } from '../../helpers/team-fixtures';

//Explained in CreateLeaguePage.spec.tsx
vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));
vi.mock('../../../src/hooks/useManagerSummary', () => ({useManagerSummary: () => ({globalRank: 1, currentGameweek: 24})}));

const LEAGUE = {id: 5, name: 'Liga de la Facultad'};

function renderPage(
    {team = MY_TEAM, lineup = MY_LINEUP}: {team?: TeamDetail; lineup?: Lineup | null} = {},
    action: ActionFunction = vi.fn(async () => ({saved: MY_LINEUP}))
) {
    renderWithRouter({
        path: '/leagues/5/team',
        element: <TeamPage/>,
        loader: () => ({league: LEAGUE, team, lineup}),
        action
    });
    return {action};
}

/** Opens the options menu of a starter and chooses one option. */
async function chooseInMenu(user: ReturnType<typeof userEvent.setup>, playerName: string, option: string) {
    await user.click(await screen.findByRole('button', {name: playerName}));
    await user.click(screen.getByRole('menuitem', {name: option}));
}

describe('TeamPage (own team, next matchday)', () => {
    it('shows the lineup ready to edit, with the lock time, the budget and the 9 formations', async () => {
        // Expected: team name, budget, lock on Tuesday 25/11 at 18:45, 11/11 starters, 9 formations with 4-3-3 checked,
        // the captain marked and no save bar (no changes yet).
        renderPage();

        expect(await screen.findByRole('heading', {name: 'Los Galácticos'})).toBeInTheDocument();
        expect(screen.getByText(/Presupuesto 3\.400\.000 €/)).toBeInTheDocument();
        expect(screen.getByText(/Se bloquea el martes 25\/11 a las 18:45/)).toBeInTheDocument();
        expect(screen.getByRole('status', {name: '11 de 11 titulares'})).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(9);
        expect(screen.getByRole('radio', {name: '4-3-3'})).toBeChecked();
        expect(screen.getByRole('button', {name: 'FWD 11 (capitán)'})).toBeInTheDocument();
        expect(screen.queryByText('Tienes cambios sin guardar.')).not.toBeInTheDocument();
    });

    it('sends a starter to the bench and marks the empty slot', async () => {
        // Expected: the empty forward slot as "Falta DEL", 10/11 starters and the save bar with "10/11".
        const user = userEvent.setup();
        renderPage();

        await chooseInMenu(user, 'FWD 12', 'Mandar al banquillo');

        expect(screen.getByRole('button', {name: 'Falta DEL: elegir jugador'})).toBeInTheDocument();
        expect(screen.getByRole('status', {name: '10 de 11 titulares'})).toBeInTheDocument();
        expect(screen.getByText('Tienes cambios sin guardar.')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Guardar alineación/})).toHaveTextContent('10/11');
    });

    it('puts a substitute of the squad table in the empty slot of his position', async () => {
        // Expected: after benching FWD 12, clicking FWD 14 in the squad fills the line again (11/11).
        const user = userEvent.setup();
        renderPage();
        await chooseInMenu(user, 'FWD 12', 'Mandar al banquillo');

        await user.click(within(screen.getByRole('table')).getByRole('button', {name: 'FWD 14'}));

        expect(screen.getByRole('status', {name: '11 de 11 titulares'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Falta DEL: elegir jugador'})).not.toBeInTheDocument();
    });

    it('changes the formation leaving empty slots where the squad has no players', async () => {
        // Expected: in 3-5-2 two midfield slots stay empty (the 4th defender and 3rd forward go to the bench): 9/11.
        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('radio', {name: '3-5-2'}));

        expect(screen.getAllByRole('button', {name: 'Falta MED: elegir jugador'})).toHaveLength(2);
        expect(screen.getByRole('status', {name: '9 de 11 titulares'})).toBeInTheDocument();
    });

    it('fills an empty slot with the player chosen in the dialog', async () => {
        // Expected: the dialog lists the 4 midfielders and "Alinear" puts the substitute MID 10 in the slot.
        const user = userEvent.setup();
        renderPage();
        await chooseInMenu(user, 'MID 8', 'Mandar al banquillo');

        await user.click(screen.getByRole('button', {name: 'Falta MED: elegir jugador'}));
        const dialog = screen.getByRole('dialog', {name: 'Elegir centrocampista'});
        expect(within(dialog).getAllByRole('radio')).toHaveLength(4);
        await user.click(within(dialog).getByRole('radio', {name: /MID 10/}));
        await user.click(within(dialog).getByRole('button', {name: 'Alinear'}));

        expect(screen.getByRole('button', {name: 'MID 10'})).toBeInTheDocument();
        expect(screen.getByRole('status', {name: '11 de 11 titulares'})).toBeInTheDocument();
    });

    it('changes the captain from the menu of a starter', async () => {
        // Expected: FWD 12 becomes the captain and FWD 11 is no longer.
        const user = userEvent.setup();
        renderPage();

        await chooseInMenu(user, 'FWD 12', 'Hacer capitán');

        expect(screen.getByRole('button', {name: 'FWD 12 (capitán)'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'FWD 11'})).toBeInTheDocument();
    });

    it('does not offer the captain in a league without captain', async () => {
        // Expected: the menu has "Cambiar jugador" and "Mandar al banquillo" only.
        const user = userEvent.setup();
        renderPage({lineup: {...MY_LINEUP, captainEnabled: false, captainId: null}});

        await user.click(await screen.findByRole('button', {name: 'FWD 12'}));

        expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Cambiar jugador', 'Mandar al banquillo']);
    });

    it('asks before saving an incomplete lineup and sends it with the matchday being edited', async () => {
        // Expected: the confirmation dialog, then the action receives the 10 starters, no captain change and matchday 13,
        // and the page says it was saved for matchday 13.
        const user = userEvent.setup();
        const {action} = renderPage();
        await chooseInMenu(user, 'DEF 5', 'Mandar al banquillo');

        await user.click(screen.getByRole('button', {name: /Guardar alineación/}));
        const dialog = screen.getByRole('dialog', {name: '¿Guardar la alineación incompleta?'});
        expect(dialog).toHaveTextContent('Te falta 1 titular. Si la jornada 13 empieza así, tu equipo no puntuará en ella.');
        await user.click(within(dialog).getByRole('button', {name: 'Guardar igualmente'}));

        await waitFor(() => expect(action).toHaveBeenCalled());
        const {request} = vi.mocked(action).mock.calls[0][0];
        const body = await request.json();
        expect(body).toMatchObject({formation: '4-3-3', captainId: 11, matchday: 13});
        expect(body.players).toHaveLength(10);
        expect(await screen.findByText('Alineación guardada para la jornada 13.')).toBeInTheDocument();
    });

    it('warns when the lineup was saved for the following matchday', async () => {
        // Expected: the matchday started while editing, so the warning names matchdays 13 and 14.
        const user = userEvent.setup();
        renderPage({}, vi.fn(async () => ({saved: {...MY_LINEUP, matchday: {...MY_LINEUP.matchday, number: 14}}, movedFrom: 13})));
        await chooseInMenu(user, 'FWD 12', 'Hacer capitán');

        await user.click(screen.getByRole('button', {name: /Guardar alineación/}));

        expect(await screen.findByText('La jornada 13 empezó mientras editabas.')).toBeInTheDocument();
        expect(screen.getByText(/Tu alineación se ha guardado para la jornada 14./)).toBeInTheDocument();
    });

    it('shows the error of the backend', async () => {
        // Expected: the Spanish message returned by the action.
        const user = userEvent.setup();
        renderPage({}, vi.fn(async () => ({formError: 'La temporada ha terminado: ya no se pueden cambiar las alineaciones.'})));
        await chooseInMenu(user, 'FWD 12', 'Hacer capitán');

        await user.click(screen.getByRole('button', {name: /Guardar alineación/}));

        expect(await screen.findByRole('alert')).toHaveTextContent('La temporada ha terminado');
    });

    it('discards the changes', async () => {
        // Expected: after "Descartar" the starter is back and the save bar disappears.
        const user = userEvent.setup();
        renderPage();
        await chooseInMenu(user, 'FWD 12', 'Mandar al banquillo');

        await user.click(screen.getByRole('button', {name: 'Descartar'}));

        expect(screen.getByRole('button', {name: 'FWD 12'})).toBeInTheDocument();
        expect(screen.queryByText('Tienes cambios sin guardar.')).not.toBeInTheDocument();
    });
});

describe('TeamPage (matchday selector)', () => {
    it('replaces the gameweek badge of the header with the matchdays of the league', async () => {
        // Expected: one "Jornada" selector with matchdays 13, 12 and 11 (newest first), 13 selected, and no other badge.
        renderPage();

        const selector = await screen.findByRole('combobox', {name: 'Jornada'});
        expect(within(selector).getAllByRole('option').map((option) => option.textContent)).toEqual(['JORNADA 13', 'JORNADA 12', 'JORNADA 11']);
        expect(selector).toHaveValue('13');
        expect(screen.queryByText('JORNADA 24')).not.toBeInTheDocument();
    });
});

describe('TeamPage (read-only)', () => {
    it('shows the team of another member without budget nor editing', async () => {
        // Expected: owner and rank instead of the budget, no formation selector and starters that can not be clicked.
        renderPage({team: OTHER_TEAM, lineup: {...MY_LINEUP, editable: false}});

        expect(await screen.findByText('de lucia_g · 1.º en la clasificación · 14 / 23 jugadores')).toBeInTheDocument();
        expect(screen.queryByText(/Presupuesto/)).not.toBeInTheDocument();
        expect(screen.queryByRole('radio')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'FWD 12'})).not.toBeInTheDocument();
    });

    it('explains that my lineup of a matchday being played is locked', async () => {
        // Expected: the "en juego" notice pointing to matchday 13, and no bench.
        renderPage({lineup: {...MY_LINEUP, matchday: MATCHDAY_12, editable: false}});

        expect(await screen.findByText('La jornada 12 está en juego')).toBeInTheDocument();
        expect(screen.getByRole('link', {name: 'jornada 13'})).toBeInTheDocument();
        expect(screen.queryByRole('heading', {name: 'BANQUILLO'})).not.toBeInTheDocument();
    });

    it('shows the squad and a notice while the league has no matchdays', async () => {
        // Expected: the notice and the 14 players of the squad, without pitch.
        renderPage({lineup: null});

        expect(await screen.findByText('Todavía no hay jornadas')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(15);
    });
});
