import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionFunction } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NAME_UPDATED_NOTICE_MS } from '../../../src/components/profile/ProfileIdentity';
import { ProfilePage } from '../../../src/pages/ProfilePage';
import type { UserProfile } from '../../../src/services/auth.service';
import type { MyLeague } from '../../../src/services/league.service';
import { MY_LEAGUE } from '../../helpers/league-fixtures';
import { renderWithRouter } from '../../helpers/render-with-router';

//Explained in CreateLeaguePage.spec.tsx
vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

const PROFILE: UserProfile = {
    id: 1,
    name: 'ApexManager',
    email: 'apex.manager@gmail.com',
    role: 'USER',
    registerDate: '2026-09-15T10:00:00.000Z'
};
// The profile comes from protectedLoader in the app; here it is fixed (each test starts with PROFILE)
const auth = vi.hoisted(() => ({profile: null as UserProfile | null}));
vi.mock('../../../src/hooks/useAuth', () => ({useAuth: () => ({profile: auth.profile})}));

function league(id: number, name: string, teamName: string, totalPoints: number, rank: number, membersCount: number): MyLeague {
    return {...MY_LEAGUE, id, name, membersCount, team: {...MY_LEAGUE.team, id: 100 + id, name: teamName, totalPoints, rank}};
}

const LEAGUES = [
    league(1, 'Liga de la Facultad', 'Los Galácticos', 305, 1, 8),
    league(2, 'Amigos del barrio', 'Apex United', 281, 2, 6)
];

interface RenderOptions {
    leagues?: MyLeague[];
    signInMethod?: 'password' | 'google';
    action?: ActionFunction;
}

function renderProfilePage({leagues = LEAGUES, signInMethod = 'password', action = vi.fn(async () => null)}: RenderOptions = {}) {
    renderWithRouter({path: '/profile', element: <ProfilePage/>, loader: () => ({leagues, signInMethod}), action});
    return {action};
}

/** An action that records the fields of each submission and answers with `result`. */
function recordingAction(result: unknown) {
    const calls: Record<string, FormDataEntryValue>[] = [];
    const action = vi.fn(async ({request}: {request: Request}) => {
        calls.push(Object.fromEntries(await request.formData()));
        return result;
    });
    return {action, calls};
}

describe('ProfilePage', () => {
    beforeEach(() => {
        auth.profile = PROFILE;
    });

    it('sends the administrator to the start page, as they have no manager profile', async () => {
        // Expected: the home page instead of "Mi perfil".
        auth.profile = {...PROFILE, role: 'ADMIN'};
        renderProfilePage();

        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(screen.queryByRole('heading', {name: 'Mi perfil'})).not.toBeInTheDocument();
    });

    it('shows the identity of the user with the initials as avatar', async () => {
        // Expected: the name as heading, "AM" in the avatar, the email and "En FootFusion desde septiembre de 2026".
        renderProfilePage();

        expect(await screen.findByRole('heading', {name: 'ApexManager'})).toBeInTheDocument();
        expect(screen.getByRole('img', {name: 'ApexManager'})).toHaveTextContent('AM');
        expect(screen.getAllByText('apex.manager@gmail.com').length).toBeGreaterThan(0);
        expect(screen.getByText(/En FootFusion desde septiembre de 2026/)).toBeInTheDocument();
    });

    it('shows the stats derived from the leagues', async () => {
        // Expected: 2 leagues, 586 points (305 + 281) and the 1st place of "Liga de la Facultad".
        renderProfilePage();

        const stat = (label: string) => (screen.getByText(label).closest('div') as HTMLElement).textContent;
        await screen.findByText('LIGAS');
        expect(stat('LIGAS')).toContain('2');
        expect(stat('PUNTOS TOTALES')).toContain('586');
        expect(stat('MEJOR PUESTO')).toContain('1.º');
        expect(stat('MEJOR PUESTO')).toContain('en Liga de la Facultad');
    });

    it('lists each league with the team, points and position, linked to the league', async () => {
        // Expected: one link per league to /leagues/:id with the team, the points and "N.º de M".
        renderProfilePage();

        const rows = await screen.findAllByRole('link', {name: /Liga de la Facultad|Amigos del barrio/});
        expect(rows.map((row) => row.getAttribute('href'))).toEqual(['/leagues/1', '/leagues/2']);
        expect(rows[0]).toHaveTextContent('Los Galácticos');
        expect(rows[0]).toHaveTextContent('305 pts');
        expect(rows[0]).toHaveTextContent('1.ºde 8');
        expect(rows[1]).toHaveTextContent('2.ºde 6');
    });

    it('invites to join a league and shows empty stats when there are none', async () => {
        // Expected: "Todavía no juegas en ninguna liga.", a link to /leagues, 0 points and "–" as best position.
        renderProfilePage({leagues: []});

        expect(await screen.findByText('Todavía no juegas en ninguna liga.')).toBeInTheDocument();
        expect(screen.getByRole('link', {name: 'Crear o unirme a una liga'})).toHaveAttribute('href', '/leagues');
        expect((screen.getByText('MEJOR PUESTO').closest('div') as HTMLElement)).toHaveTextContent('–');
    });

    describe('editing the name', () => {
        it('opens the editor with the current name and a counter, and cancels with Escape', async () => {
            // Expected: an input with "ApexManager" and "11 / 30"; Escape closes it without saving.
            const {action} = renderProfilePage();

            await userEvent.click(await screen.findByRole('button', {name: 'Editar nombre'}));
            const input = screen.getByLabelText('Nombre de mánager');
            expect(input).toHaveValue('ApexManager');
            expect(input).toHaveAttribute('maxlength', '30');
            expect(screen.getByText('11 / 30')).toBeInTheDocument();

            await userEvent.type(input, '{Escape}');

            expect(screen.queryByLabelText('Nombre de mánager')).not.toBeInTheDocument();
            expect(action).not.toHaveBeenCalled();
        });

        it('sends the new name and closes the editor with a success message', async () => {
            // Expected: the action receives {intent: "rename", name}, the editor closes and the success alert is shown.
            const {action, calls} = recordingAction({nameUpdated: true});
            renderProfilePage({action});

            await userEvent.click(await screen.findByRole('button', {name: 'Editar nombre'}));
            const input = screen.getByLabelText('Nombre de mánager');
            await userEvent.clear(input);
            await userEvent.type(input, 'Apex United');
            await userEvent.click(screen.getByRole('button', {name: 'Guardar'}));

            await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
            expect(calls[0]).toEqual({intent: 'rename', name: 'Apex United'});
            expect(await screen.findByText('Nombre actualizado. Lo verán el resto de miembros de tus ligas.')).toBeInTheDocument();
            expect(screen.queryByLabelText('Nombre de mánager')).not.toBeInTheDocument();
        });

        it('hides the success message after a few seconds', async () => {
            // Expected: the alert is shown after saving and is gone once NAME_UPDATED_NOTICE_MS have passed.
            vi.useFakeTimers({shouldAdvanceTime: true});
            try {
                const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
                renderProfilePage({action: vi.fn(async () => ({nameUpdated: true}))});

                await user.click(await screen.findByRole('button', {name: 'Editar nombre'}));
                await user.click(screen.getByRole('button', {name: 'Guardar'}));
                expect(await screen.findByText(/Nombre actualizado/)).toBeInTheDocument();

                await act(() => vi.advanceTimersByTimeAsync(NAME_UPDATED_NOTICE_MS));

                expect(screen.queryByText(/Nombre actualizado/)).not.toBeInTheDocument();
            } finally {
                vi.useRealTimers();
            }
        });

        it('keeps the editor open with the error returned by the action', async () => {
            // Expected: the field error under the input, the input marked invalid and no success message.
            const {action} = recordingAction({fieldErrors: {name: 'El nombre de mánager debe tener entre 3 y 30 caracteres.'}});
            renderProfilePage({action});

            await userEvent.click(await screen.findByRole('button', {name: 'Editar nombre'}));
            await userEvent.clear(screen.getByLabelText('Nombre de mánager'));
            await userEvent.type(screen.getByLabelText('Nombre de mánager'), 'Al');
            await userEvent.click(screen.getByRole('button', {name: 'Guardar'}));

            expect(await screen.findByText('El nombre de mánager debe tener entre 3 y 30 caracteres.')).toBeInTheDocument();
            expect(screen.getByLabelText('Nombre de mánager')).toHaveAttribute('aria-invalid', 'true');
            expect(screen.queryByText(/Nombre actualizado/)).not.toBeInTheDocument();
        });
    });

    describe('account', () => {
        it('offers the password change to accounts with a password and confirms the email sent', async () => {
            // Expected: "Correo y contraseña", the action receives {intent: "changePassword"}, the button turns into
            // "Enviado" (disabled) and the notice shows the masked address.
            const {action, calls} = recordingAction({passwordEmailSentTo: 'a***r@gmail.com'});
            renderProfilePage({action});

            expect(await screen.findByText('Correo y contraseña')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', {name: 'Cambiar contraseña'}));

            await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
            expect(calls[0]).toEqual({intent: 'changePassword'});
            expect(await screen.findByRole('button', {name: 'Enviado'})).toBeDisabled();
            expect(screen.getByRole('status')).toHaveTextContent('Te hemos enviado un correo a a***r@gmail.com.');
        });

        it('shows the error when the email cannot be sent', async () => {
            // Expected: an alert with the message and the button available again.
            renderProfilePage({action: vi.fn(async () => ({formError: 'Demasiados intentos. Inténtalo más tarde.'}))});

            await userEvent.click(await screen.findByRole('button', {name: 'Cambiar contraseña'}));

            expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos. Inténtalo más tarde.');
            expect(screen.getByRole('button', {name: 'Cambiar contraseña'})).toBeEnabled();
        });

        it('explains that Google manages the password of Google accounts', async () => {
            // Expected: "Cuenta de Google", the notice and no "Cambiar contraseña" button.
            renderProfilePage({signInMethod: 'google'});

            const account = (await screen.findByRole('heading', {name: 'CUENTA'})).closest('section') as HTMLElement;
            expect(within(account).getByText('Cuenta de Google')).toBeInTheDocument();
            expect(within(account).getByText(/Tu contraseña la gestiona Google/)).toBeInTheDocument();
            expect(within(account).queryByRole('button', {name: 'Cambiar contraseña'})).not.toBeInTheDocument();
        });
    });
});
