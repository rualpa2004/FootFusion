import { AtSign, Check, KeyRound, Lock, MailCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useFetcher } from "react-router-dom";
import { CHANGE_PASSWORD_INTENT, type profileAction } from "../../router/profile-actions";
import { GoogleIcon } from "../auth/GoogleIcon";
import { FormAlert } from "../form/FormAlert";
import { SECONDARY_BUTTON_CLASSES } from "../form/button-styles";

interface AccountRowProps {
    icon: LucideIcon | typeof GoogleIcon;
    label: ReactNode;
    value: string;
    action?: ReactNode;
}

function AccountRow({icon: Icon, label, value, action}: Readonly<AccountRowProps>) {
    return (
        <li className="flex items-center gap-3 border-t border-line py-3.5 first:border-t-0 first:pt-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted">
                <Icon className="size-[18px]" aria-hidden/>
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-semibold text-white">{label}</span>
                <span className="truncate text-xs text-muted">{value}</span>
            </div>
            {action}
        </li>
    );
}

function passwordButtonLabel(isSending: boolean, isSent: boolean): string {
    if (isSent) return 'Enviado';
    return isSending ? 'Enviando...' : 'Cambiar contraseña';
}

interface AccountPanelProps {
    email: string;
    signInMethod: 'password' | 'google';
}

/** Email and sign-in method of the account and, for accounts with a password, the password change. */
export function AccountPanel({email, signInMethod}: Readonly<AccountPanelProps>) {
    const fetcher = useFetcher<typeof profileAction>();
    const sentTo = fetcher.data?.passwordEmailSentTo;
    const isSending = fetcher.state !== 'idle';

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-col gap-1">
                <h2 className="font-display text-lg font-bold text-white">CUENTA</h2>
                <p className="text-xs text-muted">Datos de acceso a FootFusion.</p>
            </div>

            <ul className="flex flex-col">
                <AccountRow
                    icon={AtSign}
                    label={<>Correo electrónico <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                        <Check className="size-3" aria-hidden/>Verificado
                    </span></>}
                    value={email}
                />
                {signInMethod === 'password' ? (
                    <>
                        <AccountRow icon={KeyRound} label="Acceso" value="Correo y contraseña"/>
                        <AccountRow
                            icon={Lock}
                            label="Contraseña"
                            value="••••••••"
                            action={
                                <fetcher.Form method="post">
                                    <button
                                        type="submit"
                                        name="intent"
                                        value={CHANGE_PASSWORD_INTENT}
                                        disabled={isSending || Boolean(sentTo)}
                                        className={SECONDARY_BUTTON_CLASSES}
                                    >
                                        {passwordButtonLabel(isSending, Boolean(sentTo))}
                                    </button>
                                </fetcher.Form>
                            }
                        />
                    </>
                ) : (
                    <AccountRow icon={GoogleIcon} label="Acceso" value="Cuenta de Google"/>
                )}
            </ul>

            {sentTo && (
                <FormAlert variant="success" icon={MailCheck}>
                    <b>Te hemos enviado un correo a {sentTo}.</b> Abre el enlace para elegir tu nueva contraseña. Caduca en 1 hora.
                </FormAlert>
            )}
            {fetcher.data?.formError && <FormAlert variant="error">{fetcher.data.formError}</FormAlert>}
            {signInMethod === 'google' && (
                <p className="text-xs text-muted">Tu contraseña la gestiona Google: cámbiala desde tu cuenta de Google.</p>
            )}
        </section>
    );
}
