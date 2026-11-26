import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, data, RouterProvider, type LoaderFunction } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorPage, RouteErrorPage } from '../../../src/components/RouteErrorPage';

//Explained in CreateLeaguePage.spec.tsx
vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

/** A page whose loader runs `loader`, with the in-app or the root error page as its ErrorBoundary. */
function renderFailingPage(loader: LoaderFunction, ErrorBoundary = AppErrorPage) {
    const router = createMemoryRouter(
        [
            {path: '/page', element: <p>Page loaded</p>, loader, ErrorBoundary, HydrateFallback: () => null},
            {path: '/home', element: <p>Home page</p>}
        ],
        {initialEntries: ['/page']}
    );
    render(<RouterProvider router={router}/>);
}

describe('RouteErrorPage', () => {
    beforeEach(() => {
        // The error pages log the error on purpose; silence it to keep the test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('explains a league that does not exist with "404" and the ways out of it', async () => {
        // Expected: "404", "No encontramos esta liga", a link to /leagues and "Ir al inicio" to /home.
        renderFailingPage(() => {
            throw data('League not found', {status: 404});
        });

        expect(await screen.findByRole('heading', {name: 'No encontramos esta liga'})).toBeInTheDocument();
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByRole('link', {name: 'Ver mis ligas'})).toHaveAttribute('href', '/leagues');
        expect(screen.getByRole('link', {name: 'Ir al inicio'})).toHaveAttribute('href', '/home');
        expect(screen.queryByRole('button', {name: 'Reintentar'})).not.toBeInTheDocument();
    });

    it('loads the page again with "Reintentar" after a connection failure', async () => {
        // Expected: "No se ha podido conectar" without "404"; after "Reintentar" the loader runs again and the page shows.
        const loader = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(null);
        renderFailingPage(loader);

        expect(await screen.findByRole('heading', {name: 'No se ha podido conectar'})).toBeInTheDocument();
        expect(screen.queryByText('404')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: 'Reintentar'}));

        expect(await screen.findByText('Page loaded')).toBeInTheDocument();
        await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
    });

    it('never shows the technical detail of an unexpected error', async () => {
        // Expected: "Algo ha salido mal" with "Reintentar", and the original message nowhere on the screen.
        renderFailingPage(() => {
            throw new Error('Database connection lost');
        });

        expect(await screen.findByRole('heading', {name: 'Algo ha salido mal'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Reintentar'})).toBeInTheDocument();
        expect(screen.queryByText(/Database connection lost/)).not.toBeInTheDocument();
    });

    it('outside the app shows the logo and goes back to the landing page', async () => {
        // Expected: the root version with the logo, "Página no encontrada" and "Volver al inicio" to "/".
        renderFailingPage(() => {
            throw data(null, {status: 404});
        }, RouteErrorPage);

        expect(await screen.findByRole('heading', {name: 'Página no encontrada'})).toBeInTheDocument();
        expect(screen.getByRole('img', {name: /FootFusion/i})).toBeInTheDocument();
        expect(screen.getByRole('link', {name: 'Volver al inicio'})).toHaveAttribute('href', '/');
    });
});
