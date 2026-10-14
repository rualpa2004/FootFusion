import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider, type ActionFunction, type LoaderFunction } from 'react-router-dom';

interface RenderWithRouterOptions {
    /** Route path of the page under test (e.g. '/login'). */
    path: string;
    element: ReactElement;
    loader?: LoaderFunction;
    action?: ActionFunction;
}

/**
 * Renders a page inside an in-memory data router, so hooks like useActionData, useLoaderData and
 * useNavigation work as in the real app. Loaders/actions are passed in, usually as test doubles.
 * Extra routes are registered for the links of the auth pages so navigation does not fail.
 */
export function renderWithRouter({path, element, loader, action}: RenderWithRouterOptions) {
    const router = createMemoryRouter(
        [
            {path, element, loader, action, HydrateFallback: () => null},
            {path: '/login', element: <p>Login page</p>},
            {path: '/register', element: <p>Register page</p>},
            {path: '/home', element: <p>Home page</p>}
        ],
        {initialEntries: [path]}
    );

    return {router, ...render(<RouterProvider router={router}/>)};
}
