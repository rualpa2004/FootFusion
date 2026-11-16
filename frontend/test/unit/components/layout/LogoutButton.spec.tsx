import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { redirect } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LogoutButton } from '../../../../src/components/layout/LogoutButton';
import { renderWithRouter } from '../../../helpers/render-with-router';

function renderLogoutButton(logoutAction = vi.fn(async () => redirect('/login'))) {
    const result = renderWithRouter({
        path: '/home-test',
        element: <LogoutButton/>,
        routes: [{path: '/logout', action: logoutAction}]
    });
    return {...result, logoutAction};
}

describe('LogoutButton', () => {
    it('opens the confirmation dialog instead of logging out directly', async () => {
        // Expected: the "¿Cerrar sesión?" dialog open and the /logout action not called yet.
        const {logoutAction} = renderLogoutButton();

        await userEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));

        expect(screen.getByRole('alertdialog', {name: '¿Cerrar sesión?'})).toHaveAttribute('open');
        expect(logoutAction).not.toHaveBeenCalled();
    });

    it('does not log out when the user cancels', async () => {
        // Expected: the dialog closed and the /logout action never called.
        const {logoutAction} = renderLogoutButton();

        await userEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));
        await userEvent.click(screen.getByRole('button', {name: 'Cancelar'}));

        expect(screen.getByRole('alertdialog', {hidden: true})).not.toHaveAttribute('open');
        expect(logoutAction).not.toHaveBeenCalled();
    });

    it('submits to /logout and follows its redirect when the user confirms', async () => {
        // Expected: the /logout action called once and the login page shown.
        const {logoutAction, router} = renderLogoutButton();

        await userEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));
        // Second button selected (Cerrar sesión button), the first click opens the confirm alert
        await userEvent.click(screen.getAllByRole('button', {name: 'Cerrar sesión'})[1]!);

        await waitFor(() => expect(logoutAction).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    });
});
