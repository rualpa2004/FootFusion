import { ChevronDown } from "lucide-react";
import { Form, useSubmit } from "react-router-dom";
import { MATCHDAY_PARAM } from "../../router/league-loaders";
import type { Matchday } from "../../services/team.service";
import { GAMEWEEK_BADGE_CLASSES } from "../layout/PageHeader";

export function MatchdaySelector({matchdays, selected}: Readonly<{matchdays: Matchday[]; selected: number}>) {
    const submit = useSubmit();

    return (
        <Form method="get">
            <label htmlFor="lineup-matchday" className="sr-only">Jornada</label>
            <div className="relative">
                <select
                    id="lineup-matchday"
                    name={MATCHDAY_PARAM}
                    defaultValue={selected}
                    onChange={(event) => submit(event.currentTarget.form)}
                    className={`${GAMEWEEK_BADGE_CLASSES} cursor-pointer appearance-none pr-7 outline-none hover:bg-line-strong focus-visible:outline-2 focus-visible:outline-primary`}
                >
                    {[...matchdays].reverse().map((matchday) => (
                        <option key={matchday.number} value={matchday.number}>JORNADA {matchday.number}</option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted" aria-hidden/>
            </div>
        </Form>
    );
}
