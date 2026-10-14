import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '../../../../src/components/form/PasswordInput';

function renderPasswordInput() {
    render(<PasswordInput id="password" name="password" placeholder="Introduce tu contraseña"/>);
    return screen.getByPlaceholderText('Introduce tu contraseña');
}

describe('PasswordInput', () => {
    it('hides the password by default', () => {
        // Expected: type="password" and the button offers "Mostrar contraseña".
        const input = renderPasswordInput();

        expect(input).toHaveAttribute('type', 'password');
        expect(screen.getByRole('button', {name: 'Mostrar contraseña'})).toBeInTheDocument();
    });

    it('shows the password when the eye button is clicked', async () => {
        // Expected: type="text" and the button now offers "Ocultar contraseña".
        const input = renderPasswordInput();

        await userEvent.click(screen.getByRole('button', {name: 'Mostrar contraseña'}));

        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', {name: 'Ocultar contraseña'})).toBeInTheDocument();
    });

    it('hides the password again on a second click', async () => {
        // Expected: back to type="password".
        const input = renderPasswordInput();

        await userEvent.click(screen.getByRole('button', {name: 'Mostrar contraseña'}));
        await userEvent.click(screen.getByRole('button', {name: 'Ocultar contraseña'}));

        expect(input).toHaveAttribute('type', 'password');
    });

    it('keeps the typed value when toggling the visibility', async () => {
        // Expected: the value is preserved (only the type changes).
        const input = renderPasswordInput();

        await userEvent.type(input, 'secret123');
        await userEvent.click(screen.getByRole('button', {name: 'Mostrar contraseña'}));

        expect(input).toHaveValue('secret123');
    });

    it('passes its props to the real input', () => {
        // Expected: the inner <input> has the given id and name (needed by the route action).
        const input = renderPasswordInput();

        expect(input).toHaveAttribute('id', 'password');
        expect(input).toHaveAttribute('name', 'password');
    });

    it('does not submit the form when the eye button is clicked', () => {
        // Tests: the type of the eye button.
        // Expected: type="button", so clicking it never sends the login/register form.
        renderPasswordInput();

        expect(screen.getByRole('button', {name: 'Mostrar contraseña'})).toHaveAttribute('type', 'button');
    });
});
