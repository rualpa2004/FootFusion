import { Clock, RotateCw } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useSubmit } from "react-router-dom";
import { RESEND_VERIFICATION_INTENT } from "../../router/actions";

interface ResendVerificationButtonProps {
    /** Seconds the button stays blocked when it appears (60 right after a resend, 0 otherwise). */
    cooldownSeconds?: number;
    isPending: boolean;
}

const BUTTON_CLASSES = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong px-3.5 text-[13px] font-semibold text-text';

export function ResendVerificationButton({cooldownSeconds = 0, isPending}: ResendVerificationButtonProps) {
    const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
    const submit = useSubmit();

    useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }
        const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        const formData = new FormData(event.currentTarget.form ?? undefined);
        formData.set('intent', RESEND_VERIFICATION_INTENT);
        void submit(formData, {method: 'post'});
    }

    if (secondsLeft > 0) {
        return (
            <button type="button" disabled className={`${BUTTON_CLASSES} cursor-not-allowed opacity-55`}>
                <Clock className="size-4" aria-hidden/>
                Reenviar en {secondsLeft} s
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className={`${BUTTON_CLASSES} transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60`}
        >
            <RotateCw className="size-4" aria-hidden/>
            {isPending ? 'Reenviando...' : 'Reenviar correo de verificación'}
        </button>
    );
}
