interface LegalNoticeProps {
    /** Start of the sentence, e.g. "Al continuar con Google aceptas". */
    prefix: string;
}

/** Acceptance of the legal texts for sign-ups without the terms checkbox (Google). */
export function LegalNotice({prefix}: LegalNoticeProps) {
    return (
        <p className="text-center text-[11px] leading-[1.6] text-muted">
            {/* TODO: turn these into links to the legal pages once they exist. */}
            {prefix} los <span className="text-primary">Términos del servicio</span> y
            la <span className="text-primary">Política de privacidad</span>.
        </p>
    );
}
