import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InvitePanel } from '../../../../src/components/league/InvitePanel';

const INVITE_LINK = `${window.location.origin}/leagues/join/A7KQ2M`;

function renderPanel() {
    const user = userEvent.setup();
    // userEvent.setup() installs a fake clipboard; the spy records what is written in it.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<InvitePanel leagueName="Liga de la Facultad" joinCode="A7KQ2M" note="Quedan 3 plazas."/>);
    return {user, writeText};
}

describe('InvitePanel', () => {
    it('shows the code, the invitation link and the note', () => {
        // Expected: "A7KQ2M", the /leagues/join/A7KQ2M link and the note.
        renderPanel();

        // The code is in the panel and in the (closed) QR dialog.
        expect(screen.getAllByText('A7KQ2M')).toHaveLength(2);
        expect(screen.getByText(INVITE_LINK)).toBeInTheDocument();
        expect(screen.getByText('Quedan 3 plazas.')).toBeInTheDocument();
    });

    it('copies the code', async () => {
        // Expected: "A7KQ2M" written in the clipboard and the "Código copiado" notice.
        const {user, writeText} = renderPanel();

        await user.click(screen.getByRole('button', {name: /Copiar código/}));

        expect(writeText).toHaveBeenCalledWith('A7KQ2M');
        expect(screen.getByRole('status')).toHaveTextContent('Código copiado');
    });

    it('copies the invitation link', async () => {
        // Expected: the link written in the clipboard and the "Enlace copiado" notice.
        const {user, writeText} = renderPanel();

        await user.click(screen.getByRole('button', {name: /Copiar enlace/}));

        expect(writeText).toHaveBeenCalledWith(INVITE_LINK);
        expect(screen.getByRole('status')).toHaveTextContent('Enlace copiado');
    });

    it('tells the user when the clipboard is not available', async () => {
        // Expected: the "No se ha podido copiar" notice instead of an unhandled error.
        const {user, writeText} = renderPanel();
        writeText.mockRejectedValue(new Error('Permission denied'));
        vi.spyOn(console, 'error').mockImplementation(() => {});

        await user.click(screen.getByRole('button', {name: /Copiar código/}));

        expect(screen.getByRole('status')).toHaveTextContent('No se ha podido copiar');
    });

    it('opens the QR dialog of the invitation', async () => {
        // Expected: the dialog "Únete a «Liga de la Facultad»" open with the download button.
        const {user} = renderPanel();

        await user.click(screen.getByRole('button', {name: /Mostrar QR/}));

        expect(screen.getByRole('dialog', {name: 'Únete a «Liga de la Facultad»'})).toHaveAttribute('open');
        expect(screen.getByRole('button', {name: /Descargar imagen/})).toBeInTheDocument();
    });
});
