import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REVEAL_INTERVAL_MS, SquadReveal } from '../../../../src/components/league/SquadReveal';
import { JOINED_LEAGUE } from '../../../helpers/league-fixtures';
import { renderWithRouter } from '../../../helpers/render-with-router';

function renderReveal(showInvite = false) {
    return renderWithRouter({path: '/leagues', element: <SquadReveal joined={JOINED_LEAGUE} showInvite={showInvite}/>});
}

/** Simulates the "reduce motion" setting of the operating system. */
function preferReducedMotion(matches: boolean) {
    vi.stubGlobal('matchMedia', vi.fn(() => ({matches})));
}

describe('SquadReveal', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('turns the cards over one by one', async () => {
        // Expected: no card at the start, the goalkeeper after one interval and all 14 at the end.
        vi.useFakeTimers();
        renderReveal();
        await act(async () => {});

        expect(screen.queryAllByRole('article')).toHaveLength(0);

        act(() => vi.advanceTimersByTime(REVEAL_INTERVAL_MS));
        expect(screen.getAllByRole('article')).toHaveLength(1);
        expect(screen.getByRole('article')).toHaveTextContent('POR');

        act(() => vi.advanceTimersByTime(REVEAL_INTERVAL_MS * 13));
        expect(screen.getAllByRole('article')).toHaveLength(14);
        expect(screen.getByRole('heading', {name: '¡Tu plantilla está lista!'})).toBeInTheDocument();
    });

    it('shows every card at once with "Saltar animación"', async () => {
        // Expected: the 14 cards, the summary (196.000.000 €) and the "Ir a la liga" link.
        renderReveal();

        await userEvent.click(await screen.findByRole('button', {name: 'Saltar animación'}));

        expect(screen.getAllByRole('article')).toHaveLength(14);
        expect(screen.getByText('196.000.000 €')).toBeInTheDocument();
        expect(screen.getByText('1 POR · 5 DEF · 4 MED · 4 DEL')).toBeInTheDocument();
        expect(screen.getByRole('link', {name: /Ir a la liga/})).toHaveAttribute('href', '/leagues/5');
    });

    it('does not animate when the user prefers reduced motion', async () => {
        // Expected: the 14 cards visible from the start, without "Saltar animación".
        preferReducedMotion(true);
        renderReveal();

        expect(await screen.findAllByRole('article')).toHaveLength(14);
        expect(screen.queryByRole('button', {name: 'Saltar animación'})).not.toBeInTheDocument();
    });

    it('shows the card data of each player', async () => {
        // Expected: name, market value and clause of the goalkeeper in millions.
        preferReducedMotion(true);
        renderReveal();

        const goalkeeper = await screen.findByRole('article', {name: 'GK Player 1'});
        expect(goalkeeper).toHaveTextContent('Valor 14 M€');
        expect(goalkeeper).toHaveTextContent('Cláusula 17,5 M€');
    });

    it('shows the invitation only after creating the league', async () => {
        // Expected: the join code and its share buttons with showInvite; nothing without it.
        preferReducedMotion(true);
        const {unmount} = renderReveal(true);
        expect(await screen.findByRole('button', {name: /Copiar enlace/})).toBeInTheDocument();
        unmount();

        renderReveal(false);
        await screen.findAllByRole('article');
        expect(screen.queryByRole('button', {name: /Copiar enlace/})).not.toBeInTheDocument();
    });
});
