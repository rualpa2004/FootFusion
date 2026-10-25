import { LogOut } from "lucide-react";
import { useRef } from "react";
import { useFetcher } from "react-router-dom";
import { ConfirmDialog } from "../ConfirmDialog";

interface LogoutButtonProps {
    /** md: page header (40px); sm: sidebar and mobile top bar (32px). */
    size?: 'md' | 'sm';
}

const SIZE_CLASSES = {
    md: {button: 'size-10', icon: 'size-5'},
    sm: {button: 'size-8', icon: 'size-4'}
};

export function LogoutButton({size = 'md'}: LogoutButtonProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const fetcher = useFetcher();
    const classes = SIZE_CLASSES[size];

    return (
        <>
            <button
                type="button"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                onClick={() => dialogRef.current?.showModal()}
                className={`${classes.button} flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-white transition-colors hover:bg-surface-raised`}
            >
                <LogOut className={classes.icon} aria-hidden/>
            </button>
            <ConfirmDialog
                ref={dialogRef}
                title="¿Cerrar sesión?"
                description="Tendrás que volver a iniciar sesión para gestionar tus equipos y tus ligas."
                icon={LogOut}
                confirmLabel="Cerrar sesión"
                pendingLabel="Cerrando sesión..."
                isPending={fetcher.state !== 'idle'}
                onConfirm={() => fetcher.submit(null, {method: 'post', action: '/logout'})}
            />
        </>
    );
}
