import { Check, Copy, Download, Link2, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from "../form/button-styles";
import { buildInviteLink } from "../../utils/league";
import { CloseDialogButton, ModalDialog } from "../ModalDialog";

export const COPIED_NOTICE_MS = 2000;

type CopyTarget = 'code' | 'link';

const COPIED_MESSAGES: Record<CopyTarget, string> = {
    code: 'Código copiado',
    link: 'Enlace copiado'
};

interface InvitePanelProps {
    leagueName: string;
    joinCode: string;
    /** Text under the buttons (e.g. the free places of the league). */
    note?: string;
}

/** Ways of inviting friends to a league: the code, the link and a QR code of the link. */
export function InvitePanel({leagueName, joinCode, note}: InvitePanelProps) {
    const qrDialogRef = useRef<HTMLDialogElement>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    // Notice shown for a moment after copying. Local UI state, not data of a loader.
    const [notice, setNotice] = useState<string | null>(null);
    const inviteLink = buildInviteLink(joinCode);

    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = window.setTimeout(() => setNotice(null), COPIED_NOTICE_MS);
        return () => window.clearTimeout(timer);
    }, [notice]);

    async function copy(target: CopyTarget) {
        try {
            await navigator.clipboard.writeText(target === 'code' ? joinCode : inviteLink);
            setNotice(COPIED_MESSAGES[target]);
        } catch (error) {
            console.error('Failed to copy to the clipboard', error);
            setNotice('No se ha podido copiar');
        }
    }

    function downloadQr() {
        const canvas = qrCanvasRef.current;
        if (!canvas) {
            return;
        }
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `footfusion-liga-${joinCode}.png`;
        link.click();
    }

    return (
        <div className="relative flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-primary-line bg-background px-4 py-3.5">
                <span className="font-mono text-[22px] font-extrabold tracking-[.18em] text-white">{joinCode}</span>
                <span className="text-[11px] text-muted">Código</span>
            </div>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-line bg-background px-3 py-2.5 text-xs text-muted">
                <Link2 className="size-3.5 shrink-0 text-primary" aria-hidden/>
                <span className="truncate">{inviteLink}</span>
            </div>

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => copy('code')} className={`${SECONDARY_BUTTON_CLASSES} flex-1 px-2.5 text-xs`}>
                    <Copy className="size-4" aria-hidden/>Copiar código
                </button>
                <button type="button" onClick={() => copy('link')} className={`${SECONDARY_BUTTON_CLASSES} flex-1 px-2.5 text-xs`}>
                    <Link2 className="size-4" aria-hidden/>Copiar enlace
                </button>
                <button
                    type="button"
                    onClick={() => qrDialogRef.current?.showModal()}
                    className={`${SECONDARY_BUTTON_CLASSES} flex-1 px-2.5 text-xs`}
                >
                    <QrCode className="size-4" aria-hidden/>Mostrar QR
                </button>
            </div>
            {note && <p className="text-[11px] leading-4 text-muted">{note}</p>}

            {notice && (
                <p role="status" className="absolute -top-3 right-0 flex items-center gap-2 rounded-lg border border-primary-line bg-surface-raised px-3.5 py-2 text-xs text-white shadow-lg">
                    <Check className="size-3.5 text-primary" aria-hidden/>{notice}
                </p>
            )}

            <ModalDialog
                ref={qrDialogRef}
                title={`Únete a «${leagueName}»`}
                description="Escanea el código con el móvil para abrir la invitación."
                centered
            >
                <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={inviteLink}
                    size={240}
                    marginSize={2}
                    title={`Código QR de la invitación a ${leagueName}`}
                    className="rounded-lg"
                />
                <span className="font-mono text-lg font-extrabold tracking-[.18em] text-white">{joinCode}</span>
                <div className="flex justify-center gap-2.5">
                    <CloseDialogButton label="Cerrar"/>
                    <button type="button" onClick={downloadQr} className={PRIMARY_BUTTON_CLASSES}>
                        <Download className="size-4" aria-hidden/>Descargar imagen
                    </button>
                </div>
            </ModalDialog>
        </div>
    );
}