import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoadingScreen } from "../components/LoadingScreen";
import { RouteErrorPage } from "../components/RouteErrorPage";
import { HomePage } from "../pages/HomePage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { loginAction, registerAction } from "./actions";
import { homeLoader, loginLoader, protectedLoader, redirectIfAuthenticatedLoader } from "./loaders";
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
                loader: redirectIfAuthenticatedLoader,
                children: [
                    {path: 'login', element: <LoginPage/>, loader: loginLoader, action: loginAction},
                    {path: 'register', element: <RegisterPage/>, action: registerAction}
                ]
            },
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
