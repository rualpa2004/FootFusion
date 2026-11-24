import { createBrowserRouter, redirect } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoadingScreen } from "../components/LoadingScreen";
import { RouteErrorPage } from "../components/RouteErrorPage";
import { CompleteProfilePage } from "../pages/CompleteProfilePage";
import { CreateLeaguePage } from "../pages/CreateLeaguePage";
import { HomePage } from "../pages/HomePage";
import { LandingPage } from "../pages/LandingPage";
import { LeagueDetailPage } from "../pages/LeagueDetailPage";
import { LeaguesPage } from "../pages/LeaguesPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { TeamPage } from "../pages/TeamPage";
import { completeProfileAction, googleSignInAction, loginAction, logoutAction, registerAction } from "./actions";
import {
    completeProfileLoader,
    homeLoader,
    loginLoader,
    protectedLoader,
    redirectIfAuthenticatedLoader
} from "./loaders";
import { createLeagueAction, joinLeagueAction, renameLeagueAction } from "./league-actions";
import { createLeagueLoader, joinLinkLoader, leagueDetailLoader, leaguesLoader } from "./league-loaders";
import { PROTECTED_ROUTE_ID } from "./route-ids";
import { saveLineupAction } from "./team-actions";
import { lineupShortcutLoader, teamLoader } from "./team-loaders";

export const router = createBrowserRouter([
    {
        // Pathless root route: shows LoadingScreen while the first loaders run and
        // RouteErrorPage for any error thrown by a loader, action or component below.
        HydrateFallback: LoadingScreen,
        ErrorBoundary: RouteErrorPage,
        children: [
            {path: '/', element: <LandingPage/>},
            {
                element: <AuthLayout/>,
                children: [
                    {
                        // Pathless route without element: only adds the "already logged in" check to its children.
                        loader: redirectIfAuthenticatedLoader,
                        children: [
                            {path: 'login', element: <LoginPage/>, loader: loginLoader, action: loginAction},
                            {path: 'register', element: <RegisterPage/>, action: registerAction}
                        ]
                    },
                    {
                        path: 'completar-perfil',
                        element: <CompleteProfilePage/>,
                        loader: completeProfileLoader,
                        action: completeProfileAction
                    }
                ]
            },
            // Action-only routes, submitted through fetchers. They have no page, so visiting them redirects.
            {path: 'auth/google', action: googleSignInAction, loader: () => redirect('/login')},
            {path: 'logout', action: logoutAction, loader: () => redirect('/home')},
            // Invitation link: outside the protected layout so the code is saved before the session check.
            {path: 'leagues/join/:code', loader: joinLinkLoader},
            {
                id: PROTECTED_ROUTE_ID,
                element: <AppLayout/>,
                loader: protectedLoader,
                children: [
                    {path: 'home', element: <HomePage/>, loader: homeLoader},
                    {path: 'leagues', element: <LeaguesPage/>, loader: leaguesLoader, action: joinLeagueAction},
                    {path: 'leagues/new', element: <CreateLeaguePage/>, loader: createLeagueLoader, action: createLeagueAction},
                    {path: 'leagues/:leagueId', element: <LeagueDetailPage/>, loader: leagueDetailLoader, action: renameLeagueAction},
                    // The user's own team, where the lineup is edited, and the team of any other member (read-only)
                    {path: 'leagues/:leagueId/team', element: <TeamPage/>, loader: teamLoader, action: saveLineupAction},
                    {path: 'leagues/:leagueId/teams/:teamId', element: <TeamPage/>, loader: teamLoader},
                    // Menu shortcut without page: redirects to the lineup of the last league opened
                    {path: 'lineup', loader: lineupShortcutLoader}
                ]
            }
        ]
    }
]);
