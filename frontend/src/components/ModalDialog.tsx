import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode, type Ref } from "react";
import { closeDialogOnBackdropClick } from "./dialog-utils";

interface ModalDialogProps {
    ref: Ref<HTMLDialogElement>;
    title: string;
    description?: ReactNode;
    icon?: LucideIcon;
    centered?: boolean;
    children: ReactNode;
}

export function ModalDialog({ref, title, description, icon: Icon, centered = false, children}: Readonly<ModalDialogProps>) {
    const titleId = useId();

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClick={closeDialogOnBackdropClick}
            className="m-auto w-[440px] max-w-[calc(100vw-32px)] rounded-2xl border border-line-strong bg-surface p-0 text-text shadow-[0_24px_48px_rgba(0,0,0,.5)] backdrop:bg-[rgb(3_6_11/.72)]"
        >
            <div className={`flex flex-col gap-4 p-6 ${centered ? 'items-center text-center' : ''}`}>
                {Icon && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon className="size-[22px]" aria-hidden/>
                    </span>
                )}
                <div className="flex flex-col gap-1.5">
                    <h3 id={titleId} className="font-display text-xl font-extrabold text-white">{title}</h3>
                    {description && <p className="text-[13px] leading-[1.55] text-muted [&_b]:text-white">{description}</p>}
                </div>
                {children}
            </div>
        </dialog>
    );
}

export function CloseDialogButton({label = 'Cancelar'}: Readonly<{label?: string}>) {
    return (
        <button
            type="button"
            onClick={(event) => event.currentTarget.closest('dialog')?.close()}
            className="h-10 rounded-lg border border-line-strong px-3.5 text-[13px] font-semibold text-text transition-colors hover:bg-surface-raised"
        >
            {label}
        </button>
    );
}
