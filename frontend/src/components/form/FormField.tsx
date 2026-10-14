import type { ReactNode } from "react";

interface FormFieldProps {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}

/** Label + input + hint/error message. The error replaces the hint when present. */
export function FormField({label, htmlFor, error, hint, children}: FormFieldProps) {
    const messageId = `${htmlFor}-message`;

    return (
        <div className="flex flex-col gap-1.5 short:gap-1">
            <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text">{label}</label>
            {children}
            {error ? (
                <p id={messageId} className="text-[11px] leading-4 text-danger">{error}</p>
            ) : hint ? (
                <p id={messageId} className="text-[11px] leading-4 text-muted">{hint}</p>
            ) : null}
        </div>
    );
}
