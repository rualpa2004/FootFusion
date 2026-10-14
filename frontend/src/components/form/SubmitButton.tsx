import { ArrowRight } from "lucide-react";

interface SubmitButtonProps {
    label: string;
    pendingLabel: string;
    isPending: boolean;
}

export function SubmitButton({label, pendingLabel, isPending}: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center short:h-11 gap-2.5 rounded-lg bg-primary text-sm font-extrabold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isPending ? pendingLabel : label}
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden/>
        </button>
    );
}
