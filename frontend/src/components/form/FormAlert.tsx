import type { ReactNode } from "react";

interface FormAlertProps {
    variant: 'error' | 'success';
    children: ReactNode;
}

/** Form-level message (e.g. wrong credentials, account created). */
export function FormAlert({variant, children}: FormAlertProps) {
    const styles = variant === 'error'
        ? 'border-danger/40 bg-danger/10 text-danger'
        : 'border-primary-line bg-primary-soft text-primary';

    return (
        <div role={variant === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2.5 text-xs ${styles}`}>
            {children}
        </div>
    );
}
