import { KeyRound, Plus, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "../components/form/button-styles";
import { PageHeader } from "../components/layout/PageHeader";
import { JoinLeagueDialog } from "../components/league/JoinLeagueDialog";
import { LeagueCard } from "../components/league/LeagueCard";
import { SquadReveal } from "../components/league/SquadReveal";
import { SQUAD_SIZE } from "../config/league.constants";
import type { joinLeagueAction } from "../router/league-actions";
import type { leaguesLoader } from "../router/league-loaders";

function LeagueActions({onJoin}: {onJoin: () => void}) {
    return (
        <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={onJoin} className={SECONDARY_BUTTON_CLASSES}>
                <KeyRound className="size-4" aria-hidden/>Unirse con código
            </button>
            <Link to="/leagues/new" className={PRIMARY_BUTTON_CLASSES}>
                <Plus className="size-4" aria-hidden/>Crear liga
            </Link>
        </div>
    );
}

export function LeaguesPage() {
    const {leagues, pendingJoinCode} = useLoaderData<typeof leaguesLoader>();
    const actionData = useActionData<typeof joinLeagueAction>();
    const navigation = useNavigation();
    const joinDialogRef = useRef<HTMLDialogElement>(null);
    const openJoinDialog = () => joinDialogRef.current?.showModal();

    useEffect(() => {
        if (pendingJoinCode) {
            joinDialogRef.current?.showModal();
        }
    }, [pendingJoinCode]);

    // After joining, the action returns the new team and squad: the reveal replaces the list.
    if (actionData?.joined) {
        return <SquadReveal joined={actionData.joined}/>;
    }

    return (
        <>
            <PageHeader title="Ligas" subtitle="Compite con tus amigos en ligas privadas"/>

            {leagues.length > 0 ? (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold tracking-[.04em] text-muted">MIS LIGAS ({leagues.length})</span>
                        <LeagueActions onJoin={openJoinDialog}/>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                        {leagues.map((league) => <LeagueCard key={league.id} league={league}/>)}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Trophy className="size-[26px]" aria-hidden/>
                    </span>
                    <h2 className="font-display text-xl font-extrabold text-white">Aún no estás en ninguna liga</h2>
                    <p className="max-w-[420px] text-[13px] leading-[1.6] text-muted">
                        Crea tu propia liga e invita a tus amigos con el código que se genera, o únete a una existente
                        con su código de invitación. Al entrar recibirás una plantilla inicial de {SQUAD_SIZE} jugadores.
                    </p>
                    <LeagueActions onJoin={openJoinDialog}/>
                </div>
            )}

            <JoinLeagueDialog
                ref={joinDialogRef}
                defaultCode={pendingJoinCode ?? undefined}
                fieldErrors={actionData?.fieldErrors}
                formError={actionData?.formError}
                isPending={navigation.state === 'submitting'}
            />
        </>
    );
}
