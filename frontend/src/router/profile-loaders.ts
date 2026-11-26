import { getSignInMethod } from "../services/auth.service";
import { getMyLeagues } from "../services/league.service";

export async function profileLoader() {
    return {leagues: await getMyLeagues(), signInMethod: getSignInMethod()};
}
