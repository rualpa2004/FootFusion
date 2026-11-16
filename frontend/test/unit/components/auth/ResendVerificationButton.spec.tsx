import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResendVerificationButton } from '../../../../src/components/auth/ResendVerificationButton';
import { renderWithRouter } from '../../../helpers/render-with-router';

vi.mock('../../../../src/services/auth.service', () => ({}));

function renderButton({cooldownSeconds, isPending = false}: {cooldownSeconds?: number; isPending?: boolean} = {}) {
    let sentData: Record<string, FormDataEntryValue> = {};
    const action = vi.fn(async ({request}: {request: Request}) => {
        sentData = Object.fromEntries(await request.formData());
        return null;
    });

    renderWithRouter({
        path: '/login',
        element: (
            <form>
                <input name="email" defaultValue="apex@example.com"/>
                <input name="password" defaultValue="secret123"/>
                <ResendVerificationButton cooldownSeconds={cooldownSeconds} isPending={isPending}/>
            </form>
        ),
        action
    });
    return {action, getSentData: () => sentData};
}

describe('ResendVerificationButton', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends the login form with intent=resendVerification', async () => {
        // Expected: the action receives the typed email and password plus the resend intent.
        const {action, getSentData} = renderButton();

        fireEvent.click(screen.getByRole('button', {name: 'Reenviar correo de verificación'}));

        await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
        expect(getSentData()).toEqual({email: 'apex@example.com', password: 'secret123', intent: 'resendVerification'});
    });

    it('is not a submit button, so pressing Enter in the form still logs in', () => {
        // Expected: type="button" (Enter submits the form with its first *submit* button).
        renderButton();

        expect(screen.getByRole('button', {name: 'Reenviar correo de verificación'})).toHaveAttribute('type', 'button');
    });

    it('shows the pending label while resending', () => {
        // Expected: "Reenviando..." disabled.
        renderButton({isPending: true});

        expect(screen.getByRole('button', {name: 'Reenviando...'})).toBeDisabled();
    });

    it('stays blocked with a countdown and enables itself when it reaches 0', () => {
        // Expected: "Reenviar en 60 s" disabled, "Reenviar en 59 s" after one second, and the normal enabled button after 60 seconds.
        vi.useFakeTimers();
        renderButton({cooldownSeconds: 60});

        expect(screen.getByRole('button', {name: 'Reenviar en 60 s'})).toBeDisabled();

        act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByRole('button', {name: 'Reenviar en 59 s'})).toBeDisabled();

        for (let second = 0; second < 59; second++) {
            act(() => vi.advanceTimersByTime(1000));
        }
        expect(screen.getByRole('button', {name: 'Reenviar correo de verificación'})).toBeEnabled();
    });
});
