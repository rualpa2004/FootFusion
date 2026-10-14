import { useLoaderData } from "react-router-dom";
import { GameweekScoreCard } from "../components/dashboard/GameweekScoreCard";
import { LeagueStandingsCard } from "../components/dashboard/LeagueStandingsCard";
import { LineupStatusCard } from "../components/dashboard/LineupStatusCard";
import { TopPerformersCard } from "../components/dashboard/TopPerformersCard";
import { PageHeader } from "../components/layout/PageHeader";
import type { homeLoader } from "../router/loaders";

export function HomePage() {
    // Data is already loaded by homeLoader before this component renders: no loading state needed.
    const dashboard = useLoaderData<typeof homeLoader>();

    return (
        <>
            <PageHeader title="Inicio" subtitle="Campeonato de Fantasy Football"/>

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    <GameweekScoreCard score={dashboard.gameweekScore} deadline={dashboard.transferDeadline}/>
                    <LeagueStandingsCard league={dashboard.league}/>
                </div>

                <div className="flex w-full flex-col gap-6 xl:w-[380px] xl:shrink-0">
                    <TopPerformersCard gameweek={dashboard.gameweekScore.gameweek} players={dashboard.topPerformers}/>
                    <LineupStatusCard status={dashboard.lineupStatus}/>
                </div>
            </div>
        </>
    );
}
