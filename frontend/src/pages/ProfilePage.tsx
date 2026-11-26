import { useLoaderData } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { AccountPanel } from "../components/profile/AccountPanel";
import { ProfileIdentity } from "../components/profile/ProfileIdentity";
import { ProfileLeagues } from "../components/profile/ProfileLeagues";
import { ProfileStats } from "../components/profile/ProfileStats";
import { useAuth } from "../hooks/useAuth";
import type { profileLoader } from "../router/profile-loaders";
import { computeProfileStats } from "../utils/profile";

export function ProfilePage() {
    const {profile} = useAuth();
    const {leagues, signInMethod} = useLoaderData<typeof profileLoader>();

    return (
        <>
            <PageHeader title="Mi perfil" subtitle="Tus datos de mánager, tus ligas y tu cuenta"/>
            <ProfileIdentity profile={profile}/>
            <ProfileStats stats={computeProfileStats(leagues)}/>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-start">
                <ProfileLeagues leagues={leagues}/>
                <AccountPanel email={profile.email} signInMethod={signInMethod}/>
            </div>
        </>
    );
}
