import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import {
    createMemoryRouter,
    RouterProvider,
    type ActionFunction,
    type LoaderFunction,
    type RouteObject
} from 'react-router-dom';

interface RenderWithRouterOptions {
    /** Route path of the page under test (e.g. '/login'). */
    path: string;
    element: ReactElement;
    loader?: LoaderFunction;
    action?: ActionFunction;
    /** Extra routes, e.g. the action-only routes submitted by fetchers ('/auth/google', '/logout'). */
    routes?: RouteObject[];
}

/**
 * Renders a page inside an in-memory data router, so hooks like useActionData, useLoaderData,
 * useNavigation and useFetcher work as in the real app. Loaders/actions are passed in, usually as
 * test doubles. Extra routes are registered for the links and redirects of the auth pages so
 * navigation does not fail.
 */
export function renderWithRouter({path, element, loader, action, routes = []}: RenderWithRouterOptions) {
    const router = createMemoryRouter(
        [
            {path, element, loader, action, HydrateFallback: () => null},
            ...routes,
            {path: '/login', element: <p>Login page</p>},
            {path: '/register', element: <p>Register page</p>},
            {path: '/home', element: <p>Home page</p>},
            {path: '/completar-perfil', element: <p>Complete profile page</p>}
        ],
        {initialEntries: [path]}
    );

    return {router, ...render(<RouterProvider router={router}/>)};
}
