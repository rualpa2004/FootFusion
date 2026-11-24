import type { PositionGroup } from '../../src/config/league.constants';
import type { Lineup, Matchday, TeamDetail, TeamPlayer } from '../../src/services/team.service';

// Sample data of the team and lineup endpoints shared by the lineup tests.

const SQUAD_SHAPE: [PositionGroup, number][] = [['GK', 1], ['DEF', 5], ['MID', 4], ['FWD', 4]];

/** 14 players: GK 1, DEF 2-6, MID 7-10 and FWD 11-14 (playerPropertyId), named after their position and id. */
export function buildTeamSquad(): TeamPlayer[] {
    let id = 0;
    return SQUAD_SHAPE.flatMap(([positionGroup, count]) => Array.from({length: count}, () => {
        id++;
        return {
            playerPropertyId: id,
            externalPlayerId: 9000 + id,
            name: `${positionGroup} ${id}`,
            positionGroup,
            teamName: 'Athletic Club',
            marketValue: 10_000_000,
            clauseValue: 12_500_000,
            acquiredAt: '2026-11-11T10:00:00.000Z'
        };
    }));
}

export const MY_TEAM: TeamDetail = {
    id: 21,
    name: 'Los Galácticos',
    userId: 1,
    userName: 'Manager 1',
    isMine: true,
    rank: 2,
    totalPoints: 20,
    budget: 3_400_000,
    playersCount: 14,
    maxPlayers: 23,
    squad: buildTeamSquad()
};

export const OTHER_TEAM: TeamDetail = {
    ...MY_TEAM,
    id: 102,
    name: 'Real Patatas FC',
    userId: 2,
    userName: 'lucia_g',
    isMine: false,
    rank: 1,
    budget: null
};

export const MATCHDAY_11: Matchday = {
    number: 11, locksAt: '2025-11-08T13:00:00.000Z', endsAt: '2025-11-10T22:00:00.000Z', status: 'CLOSED'
};
export const MATCHDAY_12: Matchday = {
    number: 12, locksAt: '2025-11-22T13:00:00.000Z', endsAt: '2025-11-24T22:00:00.000Z', status: 'LIVE'
};
// Tuesday 25/11/2025 at 18:45 in Madrid (17:45 UTC)
export const MATCHDAY_13: Matchday = {
    number: 13, locksAt: '2025-11-25T17:45:00.000Z', endsAt: '2025-12-01T22:00:00.000Z', status: 'UPCOMING'
};

/** Complete 4-3-3 of MY_TEAM for matchday 13: GK 1, DEF 2-5, MID 7-9 and FWD 11-13, captain 11, editable. */
export const MY_LINEUP: Lineup = {
    teamId: 21,
    matchday: MATCHDAY_13,
    formation: '4-3-3',
    players: [
        {slot: 'GK1', playerPropertyId: 1},
        {slot: 'DEF1', playerPropertyId: 2}, {slot: 'DEF2', playerPropertyId: 3},
        {slot: 'DEF3', playerPropertyId: 4}, {slot: 'DEF4', playerPropertyId: 5},
        {slot: 'MID1', playerPropertyId: 7}, {slot: 'MID2', playerPropertyId: 8}, {slot: 'MID3', playerPropertyId: 9},
        {slot: 'FWD1', playerPropertyId: 11}, {slot: 'FWD2', playerPropertyId: 12}, {slot: 'FWD3', playerPropertyId: 13}
    ],
    captainId: 11,
    captainEnabled: true,
    editable: true,
    matchdays: [MATCHDAY_11, MATCHDAY_12, MATCHDAY_13]
};
