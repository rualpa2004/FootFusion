interface SegmentedOption<T extends string | number> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string | number> {
    name: string;
    legend: string;
    options: readonly SegmentedOption<T>[];
    defaultValue: T;
}

/**
 * Group of radio buttons shown as one bar of buttons, as in the designs. Each option is a real radio input
 * (sent with the form and usable with the keyboard), visually hidden behind its label.
 */
export function SegmentedControl<T extends string | number>({name, legend, options, defaultValue}: Readonly<SegmentedControlProps<T>>) {
    return (
        <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-xs font-semibold text-text">{legend}</legend>
            <div className="flex gap-1 rounded-lg border border-line bg-background p-1">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex flex-1 cursor-pointer justify-center rounded-md px-1.5 py-2 text-[13px] font-medium text-muted transition-colors has-checked:bg-primary-soft has-checked:font-bold has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-primary"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            defaultChecked={option.value === defaultValue}
                            className="sr-only"
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}