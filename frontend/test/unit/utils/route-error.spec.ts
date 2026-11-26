import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../src/services/api.client';
import { describeRouteError } from '../../../src/utils/route-error';

//Explained in CreateLeaguePage.spec.tsx
vi.mock('../../../src/config/firebase', () => ({auth: {currentUser: null, authStateReady: async () => {}}}));

/** The error useRouteError() gives when a loader throws data(message, {status}) (an ErrorResponse). */
function routeResponse(message: string, status: number) {
    return {status, statusText: '', internal: false, data: message};
}

describe('describeRouteError', () => {
    it('explains that the league does not exist and suggests the leagues page', () => {
        // Expected: kind notFound, "No encontramos esta liga" and the "Ver mis ligas" suggestion.
        const description = describeRouteError(routeResponse('League not found', 404));

        expect(description).toEqual({
            kind: 'notFound',
            title: 'No encontramos esta liga',
            message: 'Puede que el enlace esté mal escrito o que la liga se haya eliminado.',
            suggestion: {to: '/leagues', label: 'Ver mis ligas'}
        });
    });

    it('explains that the team does not exist', () => {
        // Expected: kind notFound and "No encontramos este equipo".
        expect(describeRouteError(routeResponse('Team not found', 404))).toMatchObject({
            kind: 'notFound', title: 'No encontramos este equipo'
        });
    });

    it.each([
        ['an unknown not found response', routeResponse('Something else', 404)],
        ['a 404 of the API not handled by the loader', new ApiError(404, 'Not Found')]
    ])('uses the generic "not found" message for %s', (_case, error) => {
        // Expected: kind notFound, "Página no encontrada" and no suggestion.
        expect(describeRouteError(error)).toEqual({
            kind: 'notFound', title: 'Página no encontrada', message: 'La página que buscas no existe.'
        });
    });

    it.each([
        ['a 403 response', routeResponse('Forbidden', 403)],
        ['a 403 of the API', new ApiError(403, 'The user is banned')]
    ])('says that the user has no access for %s', (_case, error) => {
        // Expected: kind forbidden and "No tienes acceso".
        expect(describeRouteError(error)).toMatchObject({kind: 'forbidden', title: 'No tienes acceso'});
    });

    it.each(['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'])(
        'recognises the connection failure of the browsers ("%s")',
        (message) => {
            // Expected: kind network and "No se ha podido conectar".
            expect(describeRouteError(new TypeError(message))).toMatchObject({
                kind: 'network', title: 'No se ha podido conectar'
            });
        }
    );

    it.each([
        ['a 500 of the API', new ApiError(500, 'Internal server error')],
        ['a bug in a component', new TypeError("Cannot read properties of undefined (reading 'name')")],
        ['a value that is not an error', 'unexpected']
    ])('shows the generic message for %s, without its technical detail', (_case, error) => {
        // Expected: kind unexpected, "Algo ha salido mal" and a message that does not contain the original error.
        const description = describeRouteError(error);

        expect(description).toMatchObject({kind: 'unexpected', title: 'Algo ha salido mal'});
        expect(description.message).not.toContain('Cannot read');
    });
});
