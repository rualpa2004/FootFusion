import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BrandLogo } from "../BrandLogo";
import { UserAvatar } from "../UserAvatar";
import { Sidebar } from "./Sidebar";

//Frame of every protected page: sidebar on desktop, compact top bar on mobile and the page content through <Outlet/>. Its loader (protectedLoader) guarantees a logged-in user.
export function AppLayout() {
    const {profile} = useAuth();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar/>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* TODO: on mobile the sidebar navigation is hidden. A menu button here that opens
                    it as a drawer will need local UI state (open/closed). */}
                <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
                    <BrandLogo variant="circle" showName/>
                    <UserAvatar name={profile.name} photoUrl={profile.profilePhoto} className="size-8"/>
                </div>

                <main className="flex flex-1 flex-col gap-6 p-4 sm:p-8">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}
