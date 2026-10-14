import { useRouteLoaderData } from "react-router-dom";
import type { protectedLoader } from "../router/loaders";
import { PROTECTED_ROUTE_ID } from "../router/route-ids";

/** Global manager data (rank, current gameweek) shared by every protected page, loaded by protectedLoader. */
export function useManagerSummary() {
    const data = useRouteLoaderData<typeof protectedLoader>(PROTECTED_ROUTE_ID);

    if (!data) {
        throw new Error('useManagerSummary must be used inside a route nested under the protected layout');
    }
    return data.summary;
}
