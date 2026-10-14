import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: LucideIcon;
    hasError?: boolean;
    /** Element rendered at the right edge of the input (e.g. the show-password button). */
    trailing?: ReactNode;
}

/** Input field styled as in the designs. Its value is not stored in React state: it is sent with the form and the route action reads it by its name attribute */
export function TextInput({icon: Icon, hasError = false, trailing, id, ...inputProps}: TextInputProps) {
    return (
        <div
            className={`flex h-11 items-center gap-2.5 short:h-10 rounded-lg border bg-background px-3 transition-colors focus-within:border-primary ${
                hasError ? 'border-danger' : 'border-line-strong'
            }`}
        >
            <Icon className="size-[18px] shrink-0 text-muted" aria-hidden/>
            <input
                id={id}
                aria-invalid={hasError}
                aria-describedby={id ? `${id}-message` : undefined}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-muted"
                {...inputProps}
            />
            {trailing}
        </div>
    );
}
