import type { MouseEvent } from "react";

export function closeDialogOnBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
        event.currentTarget.close();
    }
}
