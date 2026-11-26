import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasProfilePage } from "../../utils/profile";
import { BrandLogo } from "../BrandLogo";
import { UserAvatar } from "../UserAvatar";
import { LogoutButton } from "./LogoutButton";
import { Sidebar } from "./Sidebar";

//Frame of every protected page: sidebar on desktop, compact top bar on mobile and the page content through <Outlet/>. Its loader (protectedLoader) guarantees a logged-in user.
export function AppLayout() {
    const {profile} = useAuth();
    // Only managers have a profile page; the administrator's avatar is not a link
    const avatar = <UserAvatar name={profile.name} photoUrl={profile.profilePhoto} className="size-8"/>;

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar/>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* TODO: on mobile the sidebar navigation is hidden. A menu button here that opens
                    it as a drawer will need local UI state (open/closed). */}
                <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
                    <BrandLogo variant="circle" showName/>
                    <div className="flex items-center gap-3">
                        {hasProfilePage(profile) ? (
                            <NavLink
                                to={'/profile'}
                                aria-label="Mi perfil"
                                className={({isActive}) => `rounded-full ${isActive ? 'ring-2 ring-primary' : ''}`}
                            >
                                {avatar}
                            </NavLink>
                        ) : avatar}
                        <LogoutButton size="sm"/>
                    </div>
                </div>

                <main className="flex flex-1 flex-col gap-6 p-4 sm:p-8">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}
