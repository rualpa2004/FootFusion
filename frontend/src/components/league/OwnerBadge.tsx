import { Crown } from "lucide-react";

export function OwnerBadge() {
    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-warning">
            <Crown className="size-3" aria-hidden/>
            Propietario
        </span>
    );
}