import { InternalServerErrorException } from "@nestjs/common";
import {
    distanceToRange, initialClause, SquadAssignmentService, SquadCandidate
} from "../../../src/services/squad-assignment.service";
import { PositionGroup, SQUAD_SHAPE } from "../../../src/config/league.constants";

const M = 1_000_000;

let nextId = 1;
const players = (positionGroup: PositionGroup, count: number, marketValue: number): SquadCandidate[] =>
    Array.from({length: count}, () => ({id: nextId++, positionGroup, marketValue}));

// Exactly the players needed for a squad, all with the same value
const exactPool = (marketValue: number): SquadCandidate[] => [
    ...players('GK', 1, marketValue),
    ...players('DEF', 5, marketValue),
    ...players('MID', 4, marketValue),
    ...players('FWD', 4, marketValue)
];

describe('initialClause', () => {
    it.each([
        [8 * M, 12 * M],                // x1.5
        [10 * M, 15 * M],               // x1.5 at the limit
        [11 * M, 15 * M],               // x1.25 = 13.75M, raised to the 15M minimum
        [20 * M, 25 * M],               // x1.25
        [7_000_001, 10_500_002]         // 10,500,001.5 rounded up to whole euros
    ])('clause of a player worth %i is %i', (value, expected) => {
        // Expected: x1.5 up to 10M; above it, max(15M, x1.25); always whole euros rounded up.
        expect(initialClause(value)).toBe(expected);
    });

    it('never gives a lower clause to a more valuable player', () => {
        // Expected: the clause does not decrease when the value grows (no jump at the 10M limit).
        const values = [9 * M, 10 * M, 10 * M + 1, 11 * M, 12 * M, 13 * M];
        const clauses = values.map(initialClause);
        for (let i = 1; i < clauses.length; i++) {
            expect(clauses[i]).toBeGreaterThanOrEqual(clauses[i - 1]);
        }
    });
});

describe('distanceToRange', () => {
    it('is 0 inside the 175M-225M range and the gap outside it', () => {
        // Expected: 0 inside the range, 5M below 175M and 10M above 225M.
        expect(distanceToRange(200 * M)).toBe(0);
        expect(distanceToRange(170 * M)).toBe(5 * M);
        expect(distanceToRange(235 * M)).toBe(10 * M);
    });
});

describe('SquadAssignmentService', () => {
    const service = new SquadAssignmentService();

    it('draws 1 GK, 5 DEF, 4 MID and 4 FWD without repeating players', () => {
        // Expected: 14 different players with the 1-5-4-4 shape.
        const candidates = [
            ...players('GK', 6, 12 * M),
            ...players('DEF', 20, 14 * M),
            ...players('MID', 20, 14 * M),
            ...players('FWD', 20, 15 * M)
        ];

        const squad = service.draw(candidates);

        expect(squad).toHaveLength(14);
        expect(new Set(squad.map((player) => player.id)).size).toBe(14);
        for (const [group, count] of Object.entries(SQUAD_SHAPE)) {
            expect(squad.filter((player) => player.positionGroup === group)).toHaveLength(count);
        }
    });

    it('returns a squad inside the value range when there is one', () => {
        // 14 players of 12M are worth 168M (below the range); every 16M player adds 4M.
        // Expected: the accepted squad is worth 175M-225M (it needs at least two 16M players).
        const candidates = [
            ...players('GK', 3, 12 * M), ...players('GK', 3, 16 * M),
            ...players('DEF', 10, 12 * M), ...players('DEF', 10, 16 * M),
            ...players('MID', 10, 12 * M), ...players('MID', 10, 16 * M),
            ...players('FWD', 10, 12 * M), ...players('FWD', 10, 16 * M)
        ];

        const total = service.draw(candidates).reduce((sum, player) => sum + player.marketValue, 0);

        expect(distanceToRange(total)).toBe(0);
    });

    it('keeps the closest squad when no squad can be inside the range', () => {
        // Only 20M players (14 x 20M = 280M) or 30M players: no squad can be worth 225M or less.
        // Expected: after all the attempts it returns a squad, the cheapest possible one (all 20M players).
        const candidates = [...exactPool(20 * M), ...exactPool(30 * M)];
        let calls = 0;
        // Alternates the draws so the attempts give different squads
        const random = () => (calls++ % 7) / 7;

        const squad = service.draw(candidates, random);

        expect(squad).toHaveLength(14);
        const total = squad.reduce((sum, player) => sum + player.marketValue, 0);
        expect(total).toBeGreaterThan(225 * M);
        expect(distanceToRange(total)).toBeLessThanOrEqual(distanceToRange(14 * 30 * M));
    });

    it('draws each player with a probability proportional to 1/value', () => {
        // Two goalkeepers of 10M and 30M: weights 1/10 and 1/30, so the 10M one has a 75% share of the wheel.
        // Expected: a random number below 0.75 picks the 10M goalkeeper and one above picks the 30M goalkeeper.
        const cheapGoalkeeper = {id: 1001, positionGroup: 'GK' as const, marketValue: 10 * M};
        const expensiveGoalkeeper = {id: 1002, positionGroup: 'GK' as const, marketValue: 30 * M};
        const others = exactPool(13 * M).filter((player) => player.positionGroup !== 'GK');
        const candidates = [cheapGoalkeeper, expensiveGoalkeeper, ...others];

        const goalkeeper = (random: number) =>
            service.draw(candidates, () => random).find((player) => player.positionGroup === 'GK');

        expect(goalkeeper(0.7)?.id).toBe(cheapGoalkeeper.id);
        expect(goalkeeper(0.8)?.id).toBe(expensiveGoalkeeper.id);
    });

    it('fails when there are not enough free agents of a position', () => {
        // Expected: InternalServerErrorException, because a squad needs 5 defenders and there are only 4.
        const candidates = exactPool(13 * M).filter((player, index, all) =>
            !(player.positionGroup === 'DEF' && all.findIndex((other) => other.positionGroup === 'DEF') === index));

        expect(() => service.draw(candidates)).toThrow(InternalServerErrorException);
    });
});
