import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = 'error' | 'success' | 'warning';

interface FormAlertProps {
    variant: AlertVariant;
    icon?: LucideIcon;
    children: ReactNode;
}

const VARIANT_STYLES: Record<AlertVariant, {box: string; icon: string}> = {
    error: {box: 'border-danger/40 bg-danger/10 text-[#FFC4BF]', icon: 'text-danger'},
    success: {box: 'border-primary-line bg-primary-soft text-[#B9F8D3]', icon: 'text-primary'},
    warning: {box: 'border-warning/35 bg-warning/8 text-[#FBE7A1]', icon: 'text-warning'}
};

/** Form-level message (e.g. wrong credentials, account created, email not verified). Bold text is shown in white. */
export function FormAlert({variant, icon: Icon, children}: FormAlertProps) {
    const styles = VARIANT_STYLES[variant];

    return (
        <div
            role={variant === 'error' ? 'alert' : 'status'}
            className={`flex gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-[1.55] [&_b]:text-white ${styles.box}`}
        >
            {Icon && <Icon className={`mt-px size-[18px] shrink-0 ${styles.icon}`} aria-hidden/>}
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}
