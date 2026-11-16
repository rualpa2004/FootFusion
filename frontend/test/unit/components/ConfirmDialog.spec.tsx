import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogOut } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';

function renderDialog({isPending = false, onConfirm = vi.fn()} = {}) {
    const ref = createRef<HTMLDialogElement>();
    render(
        <ConfirmDialog
            ref={ref}
            title="¿Cerrar sesión?"
            description="Tendrás que volver a iniciar sesión."
            icon={LogOut}
            confirmLabel="Cerrar sesión"
            pendingLabel="Cerrando sesión..."
            isPending={isPending}
            onConfirm={onConfirm}
        />
    );
    return {dialog: ref.current!, onConfirm};
}

describe('ConfirmDialog', () => {
    it('is closed until its owner opens it', () => {
        // Expected: the <dialog> exists but is not open, so it is not shown.
        const {dialog} = renderDialog();

        expect(dialog).not.toHaveAttribute('open');
    });

    it('shows the title, the description and both buttons when opened', () => {
        // Expected: an alertdialog named by the title and described by the description.
        const {dialog} = renderDialog();

        dialog.showModal();

        const shownDialog = screen.getByRole('alertdialog', {name: '¿Cerrar sesión?'});
        expect(shownDialog).toHaveAccessibleDescription('Tendrás que volver a iniciar sesión.');
        expect(screen.getByRole('button', {name: 'Cancelar'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Cerrar sesión'})).toBeEnabled();
    });

    it('closes without confirming when "Cancelar" is pressed', async () => {
        // Expected: the dialog closed and onConfirm not called.
        const {dialog, onConfirm} = renderDialog();
        dialog.showModal();

        await userEvent.click(screen.getByRole('button', {name: 'Cancelar'}));

        expect(dialog).not.toHaveAttribute('open');
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('calls onConfirm when the confirm button is pressed', async () => {
        // Expected: onConfirm called once.
        const {dialog, onConfirm} = renderDialog();
        dialog.showModal();

        await userEvent.click(screen.getByRole('button', {name: 'Cerrar sesión'}));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('closes when the backdrop (the dialog element itself) is clicked', async () => {
        // Expected: the dialog closed.
        const {dialog} = renderDialog();
        dialog.showModal();

        await userEvent.click(dialog);

        expect(dialog).not.toHaveAttribute('open');
    });

    it('stays open when its content is clicked', async () => {
        // Expected: the dialog still open.
        const {dialog} = renderDialog();
        dialog.showModal();

        await userEvent.click(screen.getByText('Tendrás que volver a iniciar sesión.'));

        expect(dialog).toHaveAttribute('open');
    });

    it('disables the confirm button and shows the pending label while the operation runs', () => {
        // Expected: "Cerrando sesión..." disabled.
        const {dialog} = renderDialog({isPending: true});
        dialog.showModal();

        expect(screen.getByRole('button', {name: 'Cerrando sesión...'})).toBeDisabled();
    });
});
