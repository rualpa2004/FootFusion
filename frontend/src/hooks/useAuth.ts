import { useRouteLoaderData } from "react-router-dom";
import type { protectedLoader } from "../router/loaders";
import { PROTECTED_ROUTE_ID } from "../router/route-ids";

/** Authenticated user's profile, loaded by protectedLoader. Only usable inside protected routes. */
export function useAuth() {
    const data = useRouteLoaderData<typeof protectedLoader>(PROTECTED_ROUTE_ID);

    if (!data) {
        throw new Error('useAuth must be used inside a route nested under the protected layout');
    }
    return {profile: data.profile};
}
