import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
    CLAUSE_HIGH_VALUE_MULTIPLIER, CLAUSE_LOW_VALUE_LIMIT, CLAUSE_LOW_VALUE_MULTIPLIER, CLAUSE_MIN_HIGH_VALUE,
    POSITION_GROUPS, PositionGroup, SQUAD_MAX_ATTEMPTS, SQUAD_MAX_VALUE, SQUAD_MIN_VALUE, SQUAD_SHAPE
} from "../config/league.constants";

// A free agent of the league that can be drawn
export interface SquadCandidate {
    id: number;                     // PlayerProperty id
    positionGroup: PositionGroup;
    marketValue: number;
}

// Release clause of an initial squad player: x1.5 up to 10M; above, x1.25 with a minimum of 15M, so a more valuable
// player never has a lower clause. Rounded up to whole euros.
export function initialClause(marketValue: number): number {
    if (marketValue <= CLAUSE_LOW_VALUE_LIMIT) {
        return Math.ceil(marketValue * CLAUSE_LOW_VALUE_MULTIPLIER);
    }
    return Math.max(CLAUSE_MIN_HIGH_VALUE, Math.ceil(marketValue * CLAUSE_HIGH_VALUE_MULTIPLIER));
}

// Distance from a squad value to the allowed range (0 inside it)
export function distanceToRange(total: number): number {
    if (total < SQUAD_MIN_VALUE) return SQUAD_MIN_VALUE - total;
    if (total > SQUAD_MAX_VALUE) return total - SQUAD_MAX_VALUE;
    return 0;
}

@Injectable()
export class SquadAssignmentService {

    // Draws the initial squad (1 GK, 5 DEF, 4 MID, 4 FWD) among the free agents. Each player is drawn with a
    // probability proportional to 1/value, so cheaper players are more likely and the squads do not concentrate the
    // stars. A squad is accepted when its total value is between 175M and 225M; after SQUAD_MAX_ATTEMPTS draws, the
    // closest one to the range is kept. `random` returns a number in [0, 1) and is replaceable in the tests.
    draw(candidates: SquadCandidate[], random: () => number = Math.random): SquadCandidate[] {
        const pools = this.groupByPosition(candidates);
        let best: SquadCandidate[] = [];
        let bestDistance = Infinity;

        for (let attempt = 0; attempt < SQUAD_MAX_ATTEMPTS; attempt++) {
            const squad = POSITION_GROUPS.flatMap((group) => this.drawWeighted(pools[group], SQUAD_SHAPE[group], random));
            const distance = distanceToRange(squad.reduce((total, player) => total + player.marketValue, 0));
            if (distance === 0) {
                return squad;
            }
            if (distance < bestDistance) {
                best = squad;
                bestDistance = distance;
            }
        }
        return best;
    }

    private groupByPosition(candidates: SquadCandidate[]): Record<PositionGroup, SquadCandidate[]> {
        const pools = Object.fromEntries(POSITION_GROUPS.map((group) => [group, [] as SquadCandidate[]])) as
            Record<PositionGroup, SquadCandidate[]>;
        for (const candidate of candidates) {
            pools[candidate.positionGroup]?.push(candidate);
        }
        for (const group of POSITION_GROUPS) {
            if (pools[group].length < SQUAD_SHAPE[group]) {
                throw new InternalServerErrorException(`Not enough free agents to draw a squad (${group})`);
            }
        }
        return pools;
    }

    // Weighted draw without replacement (roulette wheel): a drawn player is removed before the next draw
    private drawWeighted(pool: SquadCandidate[], count: number, random: () => number): SquadCandidate[] {
        const remaining = [...pool];
        const drawn: SquadCandidate[] = [];

        while (drawn.length < count) {
            const weights = remaining.map((player) => 1 / Math.max(player.marketValue, 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let target = random() * totalWeight;
            let index = 0;
            while (index < remaining.length - 1 && target >= weights[index]) {
                target -= weights[index];
                index++;
            }
            drawn.push(remaining[index]);
            remaining.splice(index, 1);
        }
        return drawn;
    }
}
