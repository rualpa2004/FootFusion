import type { ReactNode } from "react";
import { PITCH_ROWS } from "../../config/league.constants";
import { positionSlots, type LineupDraft } from "../../utils/lineup";

interface LineupPitchProps {
    draft: LineupDraft;
    renderSlot: (slot: string) => ReactNode;
}

/** Football pitch with the starters in rows: forwards on top and the goalkeeper at the bottom. */
export function LineupPitch({draft, renderSlot}: Readonly<LineupPitchProps>) {
    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#1F5C37] bg-[#0F291B] px-2 py-6 sm:px-6">
            {/* Pitch markings */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#1F5C37]"/>
            <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-28 -translate-1/2 rounded-full border border-[#1F5C37]"/>
            <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-14 w-1/3 -translate-x-1/2 border-x border-b border-[#1F5C37]"/>
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-14 w-1/3 -translate-x-1/2 border-x border-t border-[#1F5C37]"/>

            <div className="relative flex flex-col gap-6">
                {PITCH_ROWS.map((position) => (
                    <div key={position} className="flex justify-evenly gap-1">
                        {positionSlots(draft.formation, position).map((slot) => (
                            <div key={slot}>{renderSlot(slot)}</div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
