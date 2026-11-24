import { AlertCircle, CalendarClock, CheckCircle2, ChevronLeft, Info } from "lucide-react";
import { Link, useFetcher, useLoaderData } from "react-router-dom";
import { FormAlert } from "../components/form/FormAlert";
import { PageHeader } from "../components/layout/PageHeader";
import { LineupBoard } from "../components/lineup/LineupBoard";
import { MatchdaySelector } from "../components/lineup/MatchdaySelector";
import { SquadTable } from "../components/lineup/SquadTable";
import type { saveLineupAction, SaveLineupActionResult, SaveLineupRequest } from "../router/team-actions";
import type { teamLoader } from "../router/team-loaders";
import type { TeamDetail } from "../services/team.service";
import { formatEuros, formatRank } from "../utils/format";
import { toSaveInput, type LineupDraft } from "../utils/lineup";

function teamSubtitle(team: TeamDetail, leagueName: string): string {
    const players = `${team.playersCount} / ${team.maxPlayers} jugadores`;
    if (team.isMine) {
        return `${leagueName} · ${players} · Presupuesto ${formatEuros(team.budget ?? 0)}`;
    }
    // The budget of other members is private, so it is not shown
    return `de ${team.userName} · ${formatRank(team.rank)} en la clasificación · ${players}`;
}

/** Result of the last save: saved, saved for the following matchday because the one being edited started, or error. */
function SaveResult({result}: Readonly<{result: SaveLineupActionResult | undefined}>) {
    if (!result) return null;
    if (result.formError) {
        return <FormAlert variant="error" icon={AlertCircle}>{result.formError}</FormAlert>;
    }
    if (result.saved && result.movedFrom !== undefined) {
        return (
            <FormAlert variant="warning" icon={CalendarClock}>
                <b>La jornada {result.movedFrom} empezó mientras editabas.</b> Tu alineación se ha guardado para la jornada {result.saved.matchday.number}.
            </FormAlert>
        );
    }
    if (result.saved) {
        return <FormAlert variant="success" icon={CheckCircle2}>Alineación guardada para la jornada {result.saved.matchday.number}.</FormAlert>;
    }
    return null;
}

export function TeamPage() {
    const {league, team, lineup} = useLoaderData<typeof teamLoader>();
    const fetcher = useFetcher<typeof saveLineupAction>();

    const saveDraft = (draft: LineupDraft) => {
        if (!lineup) return;
        const {formation, players, captainId} = toSaveInput(draft);
        fetcher.submit({
            formation,
            captainId,
            matchday: lineup.matchday.number,
            players: players.map(({slot, playerPropertyId}) => ({slot, playerPropertyId}))
        } satisfies SaveLineupRequest, {method: 'put', encType: 'application/json'});
    };

    const boardKey = lineup
        ? `${lineup.matchday.number}|${lineup.formation}|${lineup.captainId}|${lineup.players.map((p) => `${p.slot}:${p.playerPropertyId}`).join(',')}`
        : 'none';

    return (
        <>
            <Link to={`/leagues/${league.id}`} className="flex items-center gap-1.5 self-start text-[13px] text-muted hover:text-white">
                <ChevronLeft className="size-4" aria-hidden/>Volver a {league.name}
            </Link>
            <PageHeader
                title={team.name}
                subtitle={teamSubtitle(team, league.name)}
                gameweek={lineup && (
                    <MatchdaySelector key={lineup.matchday.number} matchdays={lineup.matchdays} selected={lineup.matchday.number}/>
                )}
            />

            <SaveResult result={fetcher.data}/>

            {lineup ? (
                <LineupBoard key={boardKey} team={team} lineup={lineup} onSave={saveDraft} isSaving={fetcher.state !== 'idle'}/>
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <FormAlert variant="warning" icon={Info}>
                        <b>Todavía no hay jornadas</b> en las competiciones de esta liga. Podrás preparar la alineación cuando se conozca el calendario.
                    </FormAlert>
                    <SquadTable squad={team.squad} maxPlayers={team.maxPlayers} starterIds={null} captainId={null}/>
                </div>
            )}
        </>
    );
}
