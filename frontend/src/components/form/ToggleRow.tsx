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
export function ToggleRow({name, label, hint, checked, onChange, children}: Readonly<ToggleRowProps>) {
    // Grid instead of a wrapper span, so the texts are direct children of the label (accessible name for Sonar S6853):
    // title and hint in the first column, the switch in the second one across both rows.
    return (
        <div className="flex flex-col">
            <label
                className={`grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 border bg-background p-3 has-checked:border-primary ${
                    children ? 'rounded-t-[10px]' : 'rounded-[10px]'
                } border-line`}
            >
                <span className="text-[13px] font-semibold text-white">{label}</span>
                <span className="col-start-1 text-[11px] leading-4 text-muted">{hint}</span>
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
                    className="relative col-start-2 row-span-2 row-start-1 h-[22px] w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:left-[21px] peer-checked:after:bg-background"
                />
            </label>
            {children}
        </div>
    );
}