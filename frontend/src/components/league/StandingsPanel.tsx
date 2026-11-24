import { ChevronDown } from "lucide-react";
import { Form, Link, useSubmit } from "react-router-dom";
import { MATCHDAY_PARAM } from "../../router/league-loaders";
import { formatNumber } from "../../utils/format";
import { PODIUM_SIZE, shouldShowPodium, type Standing } from "../../utils/league";
import { UserAvatar } from "../UserAvatar";

function managerLabel(standing: Standing): string {
    return standing.isCurrentUser ? `${standing.member.userName} (Tú)` : standing.member.userName;
}

function Podium({standings}: Readonly<{standings: Standing[]}>) {
    // Second, first and third, so the leader is in the centre
    const places = [standings[1], standings[0], standings[2]];

    return (
        <ol className="flex items-end justify-center gap-3 sm:gap-5" aria-label="Podio">
            {places.map((standing) => {
                const isFirst = standing.position === 1;
                return (
                    <li
                        key={standing.member.teamId}
                        className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl bg-surface text-center ${
                            isFirst ? 'border-2 border-primary p-5' : 'border border-line p-4'
                        }`}
                    >
                        <UserAvatar name={standing.member.userName} className={isFirst ? 'size-13' : 'size-11'}/>
                        <span className="w-full truncate text-sm font-bold text-white">{managerLabel(standing)}</span>
                        <span className="w-full truncate text-[11px] text-muted">{standing.member.teamName}</span>
                        <span className={`rounded-md px-2.5 py-0.5 font-display text-xs font-extrabold ${
                            isFirst ? 'bg-primary-soft text-primary' : 'bg-surface-raised text-muted'
                        }`}>
                            #{standing.position}
                        </span>
                        <span className={isFirst ? 'text-[13px] text-primary' : 'text-xs text-muted'}>
                            {formatNumber(standing.points)} pts
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

interface StandingsPanelProps {
    standings: Standing[];
    matchdays: number[];
    selectedMatchday: number | null;    //null for season total.
}

// League ranking with a matchday selector.
export function StandingsPanel({standings, matchdays, selectedMatchday}: Readonly<StandingsPanelProps>) {
    const submit = useSubmit();

    return (
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-white">CLASIFICACIÓN</h2>
                {/* GET form: changing the option puts ?jornada=N in the URL and the loader reads it. */}
                <Form method="get" className="flex flex-col items-end gap-1.5">
                    <label htmlFor="matchday" className="sr-only">Jornada</label>
                    <div className="relative">
                        <select
                            id="matchday"
                            name={MATCHDAY_PARAM}
                            defaultValue={selectedMatchday ?? ''}
                            onChange={(event) => submit(event.currentTarget.form)}
                            className="h-10 w-[230px] appearance-none rounded-lg border border-line-strong bg-background pr-9 pl-3 text-[13px] text-white outline-none focus:border-primary"
                        >
                            <option value="">Total de la temporada</option>
                            {matchdays.map((matchday) => <option key={matchday} value={matchday}>Jornada {matchday}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-3 size-4 text-muted" aria-hidden/>
                    </div>
                    {matchdays.length === 0 && (
                        <p className="max-w-[230px] text-right text-[11px] leading-4 text-subtle">
                            Aún no se ha disputado ninguna jornada.
                        </p>
                    )}
                </Form>
            </div>

            {shouldShowPodium(standings) && <Podium standings={standings}/>}

            <table className="w-full border-separate border-spacing-y-1 text-sm">
                <thead>
                    <tr className="text-left text-xs font-bold text-muted">
                        <th scope="col" className="w-[60px] px-3 py-2">POS.</th>
                        <th scope="col" className="px-3 py-2">MÁNAGER Y EQUIPO</th>
                        <th scope="col" className="w-[130px] px-3 py-2">
                            PUNTOS ({selectedMatchday === null ? 'TOTAL' : `J${selectedMatchday}`})
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((standing) => (
                        <tr
                            key={standing.member.teamId}
                            aria-current={standing.isCurrentUser ? 'true' : undefined}
                            className={standing.isCurrentUser ? 'bg-primary-soft' : 'bg-background'}
                        >
                            <td className={`rounded-l-lg px-3 py-3 font-display font-extrabold ${
                                standing.position <= PODIUM_SIZE ? 'text-primary' : 'text-muted'
                            }`}>
                                #{standing.position}
                            </td>
                            <td className="px-3 py-3">
                                <Link
                                    to={standing.isCurrentUser ? 'team' : `teams/${standing.member.teamId}`}
                                    title={standing.isCurrentUser ? 'Ver mi alineación' : 'Ver su alineación'}
                                    className="group block"
                                >
                                    <span className="block font-bold text-white group-hover:text-primary">{managerLabel(standing)}</span>
                                    <span className="text-xs text-muted">{standing.member.teamName}</span>
                                </Link>
                            </td>
                            <td className="rounded-r-lg px-3 py-3 font-display font-extrabold text-white">
                                {formatNumber(standing.points)} pts
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
