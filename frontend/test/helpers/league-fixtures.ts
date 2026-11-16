import type { PositionGroup } from '../../src/config/league.constants';
import type {
    Competition,
    JoinedLeague,
    LeagueDetail,
    LeagueMember,
    MyLeague,
    SquadPlayer
} from '../../src/services/league.service';

// Sample data of the league endpoints shared by the league tests.

export const LA_LIGA: Competition = {id: 119924, name: 'La Liga', countryName: 'España'};
export const PREMIER: Competition = {id: 33973, name: 'Premier League', countryName: 'Inglaterra'};
export const SERIE_A: Competition = {id: 115669, name: 'Serie A', countryName: 'Italia'};
export const BUNDESLIGA: Competition = {id: 67162, name: 'Bundesliga', countryName: 'Alemania'};
export const COMPETITIONS = [LA_LIGA, PREMIER, SERIE_A, BUNDESLIGA];

export const MY_LEAGUE: MyLeague = {
    id: 5,
    name: 'Liga de la Facultad',
    competitions: [LA_LIGA, PREMIER],
    membersCount: 5,
    maxTeams: 8,
    isOwner: true,
    team: {id: 21, name: 'Los Galácticos', budget: 100_000_000, totalPoints: 0}
};

export function member(userId: number, totalPoints: number, overrides: Partial<LeagueMember> = {}): LeagueMember {
    return {
        teamId: 100 + userId,
        teamName: `Equipo ${userId}`,
        userId,
        userName: `Manager ${userId}`,
        totalPoints,
        ...overrides
    };
}

export const LEAGUE_DETAIL: LeagueDetail = {
    id: 5,
    name: 'Liga de la Facultad',
    joinCode: 'A7KQ2M',
    ownerId: 1,
    isOwner: true,
    canRename: true,
    createdAt: '2026-11-11T10:00:00.000Z',
    initialBudget: 100_000_000,
    maxTeams: 8,
    pointReward: 100_000,
    captainEnabled: false,
    multipliers: {enabled: false, finalMatchdays: null, factor: null, target: null},
    scoring: {
        minutesMaxPoints: 2, forwardGoalPoints: 4, assistPoints: 3, defenderCleanSheetPoints: 4,
        goalsConcededPenalty: -1, yellowCardPenalty: -1, redCardPenalty: -2, missedPenaltyPenalty: -1,
        ownGoalPenalty: -2, duelsWonPoints: 1, foulsCommittedPenalty: -1
    },
    competitions: [LA_LIGA, PREMIER],
    members: [member(2, 30), member(1, 20), member(3, 10)]
};

const SQUAD_SHAPE: [PositionGroup, number][] = [['GK', 1], ['DEF', 5], ['MID', 4], ['FWD', 4]];

/** 14 players (1 GK, 5 DEF, 4 MID, 4 FWD) worth 14M each: 196M in total. */
export function buildSquad(): SquadPlayer[] {
    let id = 0;
    return SQUAD_SHAPE.flatMap(([positionGroup, count]) => Array.from({length: count}, () => {
        id++;
        return {
            playerPropertyId: id,
            externalPlayerId: 9000 + id,
            name: `${positionGroup} Player ${id}`,
            positionGroup,
            teamName: 'Athletic Club',
            marketValue: 14_000_000,
            clauseValue: 17_500_000
        };
    }));
}

export const JOINED_LEAGUE: JoinedLeague = {
    league: {id: 5, name: 'Liga de la Facultad', joinCode: 'A7KQ2M'},
    team: {id: 21, name: 'Los Galácticos', budget: 100_000_000, totalPoints: 0},
    squad: buildSquad()
};
