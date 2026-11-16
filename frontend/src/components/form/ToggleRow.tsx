import type { ChangeEvent, ReactNode } from "react";

interface ToggleRowProps {
    name: string;
    label: string;
    hint: string;
    checked?: boolean;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    children?: ReactNode;
}

/** On/off switch with a title and a hint. It is a checkbox: the form receives "on" when it is checked. */
export function ToggleRow({name, label, hint, checked, onChange, children}: ToggleRowProps) {
    return (
        <div className="flex flex-col">
            <label
                className={`flex cursor-pointer items-center justify-between gap-4 border bg-background p-3 has-checked:border-primary ${
                    children ? 'rounded-t-[10px]' : 'rounded-[10px]'
                } border-line`}
            >
                <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-white">{label}</span>
                    <span className="text-[11px] leading-4 text-muted">{hint}</span>
                </span>
                <input
                    type="checkbox"
                    role="switch"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    className="peer sr-only"
                />
                <span
                    aria-hidden
                    className="relative h-[22px] w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:left-[21px] peer-checked:after:bg-background"
                />
            </label>
            {children}
        </div>
    );
}