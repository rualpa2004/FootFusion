import type { LucideIcon } from "lucide-react";
import { useId, type MouseEvent, type Ref } from "react";

interface ConfirmDialogProps {
    ref: Ref<HTMLDialogElement>;
    title: string;
    description: string;
    icon: LucideIcon;
    confirmLabel: string;
    pendingLabel: string;
    /** True while the confirmed operation runs: the confirm button is disabled and shows pendingLabel. */
    isPending?: boolean;
    onConfirm: () => void;
}

export function ConfirmDialog({
    ref,
    title,
    description,
    icon: Icon,
    confirmLabel,
    pendingLabel,
    isPending = false,
    onConfirm
}: ConfirmDialogProps) {
    const titleId = useId();
    const descriptionId = useId();

    function closeOnBackdropClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget) {
            event.currentTarget.close();
        }
    }

    return (
        <dialog
            ref={ref}
            role="alertdialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onClick={closeOnBackdropClick}
            className="m-auto w-[400px] max-w-[calc(100vw-32px)] rounded-2xl border border-line-strong bg-surface p-0 text-text shadow-[0_24px_48px_rgba(0,0,0,.5)] backdrop:bg-[rgb(3_6_11/.72)]"
        >
            <div className="flex flex-col gap-4 p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-danger/12 text-danger">
                    <Icon className="size-[22px]" aria-hidden/>
                </span>
                <div className="flex flex-col gap-1.5">
                    <h3 id={titleId} className="font-display text-xl font-extrabold text-white">{title}</h3>
                    <p id={descriptionId} className="text-[13px] leading-[1.55] text-muted">{description}</p>
                </div>
                <div className="mt-1 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={(event) => event.currentTarget.closest('dialog')?.close()}
                        className="h-10 rounded-lg border border-line-strong px-3.5 text-[13px] font-semibold text-text transition-colors hover:bg-surface-raised"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex h-10 items-center gap-2 rounded-lg bg-danger px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Icon className="size-4" aria-hidden/>
                        {isPending ? pendingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
