import { createBrowserRouter, redirect } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoadingScreen } from "../components/LoadingScreen";
import { RouteErrorPage } from "../components/RouteErrorPage";
import { CompleteProfilePage } from "../pages/CompleteProfilePage";
import { HomePage } from "../pages/HomePage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { completeProfileAction, googleSignInAction, loginAction, logoutAction, registerAction } from "./actions";
import {
    completeProfileLoader,
    homeLoader,
    loginLoader,
    protectedLoader,
    redirectIfAuthenticatedLoader
} from "./loaders";
import { PROTECTED_ROUTE_ID } from "./route-ids";

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
            {
                id: PROTECTED_ROUTE_ID,
                element: <AppLayout/>,
                loader: protectedLoader,
                children: [
                    {path: 'home', element: <HomePage/>, loader: homeLoader}
                ]
            }
        ]
    }
]);
