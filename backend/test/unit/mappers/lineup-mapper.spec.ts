import { LineupMapper } from "../../../src/mappers/lineup.mapper";
import { Lineup } from "../../../src/entities/lineup.entity";

const MATCHDAY = {number: 4, locksAt: new Date('2025-09-27T12:00:00Z'), endsAt: new Date('2025-09-29T21:59:59.999Z')};
const NOW = new Date('2025-09-25T10:00:00Z');

const view = (lineup: Partial<Lineup> | null) => ({
    teamId: 50, matchday: MATCHDAY, lineup: lineup as Lineup | null, captainEnabled: true, editable: true,
    matchdays: [MATCHDAY], now: NOW
});

describe('LineupMapper', () => {
    it('maps the lineup of the matchday with its captain and the matchday status', () => {
        // Expected: formation, starters, captain 4 and matchday 4 UPCOMING.
        const result = LineupMapper.toDTO(view({
            matchday: 4, formation: '4-3-3', captainId: 4, players: [{slot: 'FWD1', playerPropertyId: 4}] as never
        }));

        expect(result).toEqual({
            teamId: 50,
            matchday: {...MATCHDAY, status: 'UPCOMING'},
            formation: '4-3-3',
            players: [{slot: 'FWD1', playerPropertyId: 4}],
            captainId: 4,
            captainEnabled: true,
            editable: true,
            matchdays: [{...MATCHDAY, status: 'UPCOMING'}]
        });
    });

    it('drops the captain of a lineup saved for an earlier matchday', () => {
        // Expected: same starters, no captain. Matchday 3 happened, so there is no possible changes to that squad
        const result = LineupMapper.toDTO(view({
            matchday: 3, formation: '4-3-3', captainId: 4, players: [{slot: 'FWD1', playerPropertyId: 4}] as never
        }));

        expect(result.captainId).toBeNull();
        expect(result.players).toHaveLength(1);
    });

    it('gives an empty 4-4-2 without saved lineup', () => {
        // Expected: default formation, no starters and no captain.
        expect(LineupMapper.toDTO(view(null))).toMatchObject({formation: '4-4-2', players: [], captainId: null});
    });
});
