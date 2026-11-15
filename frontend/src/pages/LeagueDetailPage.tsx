import { ChevronLeft } from "lucide-react";
import { Link, useLoaderData } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { InvitePanel } from "../components/league/InvitePanel";
import { LeagueSettingsPanel } from "../components/league/LeagueSettingsPanel";
import { OwnerBadge } from "../components/league/OwnerBadge";
import { RenameLeague } from "../components/league/RenameLeague";
import { StandingsPanel } from "../components/league/StandingsPanel";
import { useAuth } from "../hooks/useAuth";
import type { leagueDetailLoader } from "../router/league-loaders";
import { buildStandings } from "../utils/league";

function freePlacesNote(membersCount: number, maxTeams: number): string {
    const freePlaces = maxTeams - membersCount;
    if (freePlaces <= 0) {
        return 'La liga está completa.';
    }
    return `${freePlaces === 1 ? 'Queda 1 plaza' : `Quedan ${freePlaces} plazas`}. Comparte el código, el enlace o el QR para que se unan.`;
}

export function LeagueDetailPage() {
    const {league, matchdays, selectedMatchday} = useLoaderData<typeof leagueDetailLoader>();
    const {profile} = useAuth();
    const standings = buildStandings(league.members, profile.id);
    const competitionNames = league.competitions.map((competition) => competition.name).join(' · ');

    return (
        <>
            <Link to="/leagues" className="flex items-center gap-1.5 self-start text-[13px] text-muted hover:text-white">
                <ChevronLeft className="size-4" aria-hidden/>Volver a mis ligas
            </Link>
            <PageHeader
                title={league.name}
                subtitle={`${competitionNames} · ${league.members.length} / ${league.maxTeams} equipos`}
                titleAside={
                    <>
                        {/* key: if the name changes, the dialog starts again with the new one. */}
                        {league.canRename && <RenameLeague key={league.name} currentName={league.name}/>}
                        {league.isOwner && <OwnerBadge/>}
                    </>
                }
            />

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <StandingsPanel standings={standings} matchdays={matchdays} selectedMatchday={selectedMatchday}/>

                <div className="flex flex-col gap-5">
                    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
                        <h2 className="font-display text-lg font-bold text-white">INVITA A TUS AMIGOS</h2>
                        <InvitePanel
                            leagueName={league.name}
                            joinCode={league.joinCode}
                            note={freePlacesNote(league.members.length, league.maxTeams)}
                        />
                    </section>
                    <LeagueSettingsPanel league={league}/>
                </div>
            </div>
        </>
    );
}
