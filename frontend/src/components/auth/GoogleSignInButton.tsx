import { FirebaseError } from "firebase/app";
import { useFetcher } from "react-router-dom";
import type { googleSignInAction } from "../../router/actions";
import { signInWithGoogle } from "../../services/auth.service";
import { FormAlert } from "../form/FormAlert";
import { GoogleIcon } from "./GoogleIcon";
import { LegalNotice } from "./LegalNotice";

interface GoogleSignInButtonProps {
    /** "Continuar con Google" in login, "Registrarse con Google" in register. */
    label: string;
}

export function GoogleSignInButton({label}: GoogleSignInButtonProps) {
    const fetcher = useFetcher<typeof googleSignInAction>();
    const isPending = fetcher.state !== 'idle';

    async function handleClick() {
        let popupErrorCode: string | undefined;
        try {
            const isSignedIn = await signInWithGoogle();
            if (!isSignedIn) {
                // The user closed the Google window: nothing to do.
                return;
            }
        } catch (error) {
            popupErrorCode = error instanceof FirebaseError ? error.code : 'unknown';
        }

        await fetcher.submit(popupErrorCode ? {popupErrorCode} : {}, {method: 'post', action: '/auth/google'});
    }

    return (
        <>
            <div className="flex items-center gap-3 text-[11px] tracking-[.06em] text-subtle uppercase">
                <span className="h-px flex-1 bg-line" aria-hidden/>
                o por Google
                <span className="h-px flex-1 bg-line" aria-hidden/>
            </div>
            <div className="flex flex-col gap-2">
                {fetcher.data?.formError && <FormAlert variant="error">{fetcher.data.formError}</FormAlert>}
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isPending}
                    className="flex h-12 items-center justify-center gap-3 rounded-lg border border-[#DADCE0] bg-white text-sm font-semibold text-[#1F1F1F] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 short:h-11"
                >
                    <GoogleIcon/>
                    {isPending ? 'Conectando con Google...' : label}
                </button>
                <LegalNotice prefix="Al continuar con Google aceptas"/>
            </div>
        </>
    );
}
