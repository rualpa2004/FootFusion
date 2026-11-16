import { LeagueMapper } from "../../../src/mappers/league.mapper";
import { LeagueCompetitionMapper } from "../../../src/mappers/league-competition.mapper";
import { LeagueScoringMapper } from "../../../src/mappers/league-scoring.mapper";
import { TeamFantasyMapper } from "../../../src/mappers/team-fantasy.mapper";
import { PlayerPropertyMapper } from "../../../src/mappers/player-property.mapper";
import { CreateLeagueDTO } from "../../../src/dtos/league/create-league.dto";
import { LeagueSummaryDTO, SquadPlayerDTO } from "../../../src/dtos/league/league-response.dto";
import { CompetitionResponseDTO } from "../../../src/dtos/competition/competition-response.dto";
import { League, MultiplierTarget } from "../../../src/entities/league.entity";
import { LeagueCompetition } from "../../../src/entities/league-competition.entity";
import { TeamFantasy } from "../../../src/entities/team-fantasy.entity";
import { PlayerProperty } from "../../../src/entities/player-property.entity";
import { User } from "../../../src/entities/user.entity";
import { CompetitionData, PlayerCardData } from "../../../src/repositories/sports-data.repository";
import { PositionGroup } from "../../../src/config/league.constants";

const SCORING = {
    minutesMaxPoints: 3, forwardGoalPoints: 4, assistPoints: 3, defenderCleanSheetPoints: 4, goalsConcededPenalty: -1,
    yellowCardPenalty: -1, redCardPenalty: -2, missedPenaltyPenalty: -2, ownGoalPenalty: -2, duelsWonPoints: 1,
    foulsCommittedPenalty: -1
};

const COMPETITIONS_BY_ID = new Map<number, CompetitionData>([
    [140, {id: 140, name: 'La Liga', logo: 'laliga.png', countryName: 'Spain'}],
    [39, {id: 39, name: 'Premier League'}]
]);

function createDTO(multipliers: CreateLeagueDTO['multipliers']): CreateLeagueDTO {
    return {
        name: '  Liga de amigos  ',
        competitionIds: [140],
        scoring: SCORING,
        pointReward: 200_000,
        captainEnabled: true,
        multipliers
    };
}

function leagueCompetition(competitionId: number): LeagueCompetition {
    return {leagueId: 15, competitionId} as LeagueCompetition;
}

describe('LeagueMapper', () => {
    describe('toEntity', () => {
        it('maps a league without multipliers', () => {
            // Expected: trimmed name, the owner and code given, and the multiplier columns null.
            expect(LeagueMapper.toEntity(createDTO({enabled: false}), 'ABC234', 7))
                .toEqual({
                    name: 'Liga de amigos',
                    joinCode: 'ABC234',
                    ownerId: 7,
                    pointReward: 200_000,
                    captainEnabled: true,
                    multipliersEnabled: false,
                    multiplierFinalMatchdays: null,
                    multiplierFactor: null,
                    multiplierTarget: null
                });
        });

        it('maps a league with multipliers', () => {
            const dto = createDTO({
                enabled: true, finalMatchdays: 4, factor: 2, target: MultiplierTarget.BOTH
            });

            // Expected: the multiplier settings are copied to their columns.
            expect(LeagueMapper.toEntity(dto, 'ABC234', 7)).toMatchObject({
                multipliersEnabled: true,
                multiplierFinalMatchdays: 4,
                multiplierFactor: 2,
                multiplierTarget: MultiplierTarget.BOTH
            });
        });

        it('ignores the multiplier settings sent with the multipliers disabled', () => {
            const dto = createDTO({
                enabled: false, finalMatchdays: 4, factor: 2, target: MultiplierTarget.BOTH
            });

            // Expected: disabled multipliers store no settings.
            expect(LeagueMapper.toEntity(dto, 'ABC234', 7)).toMatchObject({
                multipliersEnabled: false,
                multiplierFinalMatchdays: null,
                multiplierFactor: null,
                multiplierTarget: null
            });
        });
    });

    describe('toSummaryDTOs', () => {
        it('builds one summary per team with its members count and competitions', () => {
            const league = {id: 15, name: 'Liga', ownerId: 7, competitions: [leagueCompetition(140)]} as League;
            const team = {id: 42, name: 'Galácticos', budget: 100, totalPoints: 5, leagueId: 15, league} as TeamFantasy;

            const [summary] = LeagueMapper.toSummaryDTOs([team], new Map([[15, 3]]), COMPETITIONS_BY_ID, 7);

            // Expected: a LeagueSummaryDTO of the league (not of the team) with 3 members and La Liga.
            expect(summary).toBeInstanceOf(LeagueSummaryDTO);
            expect(summary).toMatchObject({id: 15, name: 'Liga', membersCount: 3, isOwner: true, team: {id: 42}});
            expect(summary.competitions).toEqual([
                {id: 140, name: 'La Liga', logo: 'laliga.png', countryName: 'Spain'}
            ]);
        });

        it('uses 0 members when the league has no count', () => {
            const league = {id: 16, name: 'Liga', ownerId: 1, competitions: []} as unknown as League;
            const team = {id: 43, leagueId: 16, league} as TeamFantasy;

            // Expected: membersCount 0 and isOwner false for another owner.
            expect(LeagueMapper.toSummaryDTOs([team], new Map(), COMPETITIONS_BY_ID, 7)[0])
                .toMatchObject({membersCount: 0, isOwner: false});
        });
    });
});

describe('LeagueCompetitionMapper', () => {
    it('maps the competitions with their MongoDB data', () => {
        const result = LeagueCompetitionMapper.toDTOs([leagueCompetition(140), leagueCompetition(39)], COMPETITIONS_BY_ID);

        // Expected: CompetitionResponseDTO instances in the same order.
        expect(result[0]).toBeInstanceOf(CompetitionResponseDTO);
        expect(result.map((competition) => competition.name)).toEqual(['La Liga', 'Premier League']);
    });

    it('keeps the id with an empty name when the competition is missing in MongoDB', () => {
        // Expected: {id: 999, name: ''}.
        expect(LeagueCompetitionMapper.toDTO(leagueCompetition(999), COMPETITIONS_BY_ID))
            .toEqual({id: 999, name: '', logo: undefined, countryName: undefined});
    });

    it('returns an empty list when the competitions are not loaded', () => {
        // Expected: [].
        expect(LeagueCompetitionMapper.toDTOs(undefined, COMPETITIONS_BY_ID)).toEqual([]);
    });
});

describe('LeagueScoringMapper', () => {
    it('adds the league id to the settings of the DTO', () => {
        // Expected: the 11 settings plus the leagueId.
        expect(LeagueScoringMapper.toEntity(SCORING, 15)).toEqual({leagueId: 15, ...SCORING});
    });

    it('returns only the settings of the entity', () => {
        const entity = {leagueId: 15, league: {id: 15} as League, ...SCORING};

        // Expected: neither leagueId nor the league relation are sent.
        expect(LeagueScoringMapper.toDTO(entity)).toEqual(SCORING);
    });

    it.each([null, undefined])('returns null without scoring (%p)', (scoring) => {
        // Expected: null.
        expect(LeagueScoringMapper.toDTO(scoring)).toBeNull();
    });
});

describe('TeamFantasyMapper', () => {
    const user = {id: 7, name: 'Rubén'} as User;

    it('uses the trimmed team name and the initial budget', () => {
        // Expected: name trimmed and budget of 100M.
        expect(TeamFantasyMapper.toEntity(user, 15, '  Galácticos  ')).toEqual({
            name: 'Galácticos', userId: 7, leagueId: 15, budget: 100_000_000
        });
    });

    it.each([undefined, '   '])('uses the user name when the team name is %p', (teamName) => {
        // Expected: the team is named after the user.
        expect(TeamFantasyMapper.toEntity(user, 15, teamName).name).toBe('Rubén');
    });
});

describe('PlayerPropertyMapper', () => {
    it('maps the eligible players as free agents with the clause equal to the value', () => {
        const players = [
            {externalPlayerId: 1, positionGroup: 'GK' as PositionGroup, marketValue: 5_000_000},
            {externalPlayerId: 2, positionGroup: 'FWD' as PositionGroup, marketValue: 20_000_000}
        ];

        // Expected: one row per player, without team.
        expect(PlayerPropertyMapper.toEntities(players, 15)).toEqual([
            {leagueId: 15, externalPlayerId: 1, marketValue: 5_000_000, clauseValue: 5_000_000},
            {leagueId: 15, externalPlayerId: 2, marketValue: 20_000_000, clauseValue: 20_000_000}
        ]);
    });

    it('joins each squad player with his card and position', () => {
        const squad = [
            {id: 100, externalPlayerId: 1, marketValue: 5_000_000, clauseValue: 7_500_000},
            {id: 101, externalPlayerId: 2, marketValue: 20_000_000, clauseValue: 25_000_000}
        ] as PlayerProperty[];
        const cards = new Map<number, PlayerCardData>([
            [1, {externalPlayerId: 1, name: 'Unai Simón', positionGroup: 'GK', teamName: 'Athletic'}]
        ]);
        const positions = new Map<number, PositionGroup>([[1, 'GK'], [2, 'FWD']]);

        const result = PlayerPropertyMapper.toSquadDTOs(squad, cards, positions);

        // Expected: SquadPlayerDTO instances; the player without card keeps an empty name and the drawn position.
        expect(result[0]).toBeInstanceOf(SquadPlayerDTO);
        expect(result[0]).toMatchObject({playerPropertyId: 100, name: 'Unai Simón', positionGroup: 'GK', clauseValue: 7_500_000});
        expect(result[1]).toMatchObject({playerPropertyId: 101, name: '', positionGroup: 'FWD', teamName: undefined});
    });
});
