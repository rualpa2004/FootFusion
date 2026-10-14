import { ArrowLeftRight, Calendar, ChartColumn, LayoutDashboard, Shirt, Trophy, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useManagerSummary } from "../../hooks/useManagerSummary";
import { formatNumber } from "../../utils/format";
import { BrandLogo } from "../BrandLogo";
import { UserAvatar } from "../UserAvatar";

interface NavItem {
    label: string;
    icon: LucideIcon;
    /** Route of the section. Items without it are rendered disabled. */
    to?: string;
}

// TODO: add `to` to each item as its page is created (e.g. '/lineup', '/market', '/leagues',
// '/matchday', '/stats') and register the route as a child of the protected layout in router/index.tsx.
const NAV_ITEMS: NavItem[] = [
    {label: 'Inicio', icon: LayoutDashboard, to: '/home'},
    {label: 'Alineación', icon: Shirt},
    {label: 'Mercado', icon: ArrowLeftRight},
    {label: 'Ligas', icon: Trophy},
    {label: 'Jornada', icon: Calendar},
    {label: 'Estadísticas', icon: ChartColumn}
];

const ITEM_BASE_CLASSES = 'flex items-center gap-3 rounded-lg px-4 py-3 text-sm';

export function Sidebar() {
    const {profile} = useAuth();
    const summary = useManagerSummary();

    return (
        <aside className="hidden w-[220px] shrink-0 flex-col gap-8 border-r border-line bg-surface p-6 lg:flex">
            <BrandLogo variant="circle" showName/>

            <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map(({label, icon: Icon, to}) => to ? (
                    <NavLink
                        key={label}
                        to={to}
                        className={({isActive}) => `${ITEM_BASE_CLASSES} ${
                            isActive
                                ? 'bg-primary-soft font-bold text-primary'
                                : 'font-medium text-text hover:bg-surface-raised'
                        }`}
                    >
                        {({isActive}) => (
                            <>
                                <Icon className={`size-[18px] ${isActive ? 'text-primary' : 'text-muted'}`} aria-hidden/>
                                {label}
                            </>
                        )}
                    </NavLink>
                ) : (
                    <span
                        key={label}
                        aria-disabled
                        title="Próximamente"
                        className={`${ITEM_BASE_CLASSES} cursor-not-allowed font-medium text-text opacity-50`}
                    >
                        <Icon className="size-[18px] text-muted" aria-hidden/>
                        {label}
                    </span>
                ))}
            </nav>

            {/* TODO: this block will link to the profile page (/profile) once it exists. */}
            <div className="flex items-center gap-2.5 border-t border-line pt-6">
                <UserAvatar name={profile.name} photoUrl={profile.profilePhoto}/>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-white">{profile.name}</span>
                    <span className="text-[11px] text-primary">Puesto #{formatNumber(summary.globalRank)}</span>
                </div>
            </div>
        </aside>
    );
}
