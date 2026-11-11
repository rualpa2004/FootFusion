import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateLeagueDTO } from "../../../src/dtos/league/create-league.dto";
import { JoinLeagueDTO } from "../../../src/dtos/league/join-league.dto";
import { RenameLeagueDTO } from "../../../src/dtos/league/rename-league.dto";

const SCORING = {
    minutesMaxPoints: 3, forwardGoalPoints: 4, assistPoints: 3, defenderCleanSheetPoints: 4, goalsConcededPenalty: -1,
    yellowCardPenalty: -1, redCardPenalty: -2, missedPenaltyPenalty: -2, ownGoalPenalty: -2, duelsWonPoints: 1,
    foulsCommittedPenalty: -1
};
const VALID = {
    name: 'Liga de amigos',
    competitionIds: [119924, 2486],
    scoring: SCORING,
    pointReward: 100_000,
    captainEnabled: false,
    multipliers: {enabled: false}
};

async function errorsOf<T extends object>(type: new () => T, plain: object): Promise<string[]> {
    const errors = await validate(plainToInstance(type, plain));
    return errors.flatMap((error) => error.children?.length
        ? error.children.map((child) => `${error.property}.${child.property}`)
        : [error.property]);
}

describe('CreateLeagueDTO', () => {
    it('accepts a valid league', async () => {
        // Expected: no errors.
        expect(await errorsOf(CreateLeagueDTO, VALID)).toEqual([]);
    });

    it.each([
        ['  ab  ', 'a 2-character name once trimmed'],
        ['x'.repeat(31), 'a 31-character name']
    ])('rejects %p (%s)', async (name: string) => {
        // Expected: the name must have 3-30 characters without the spaces at both ends.
        expect(await errorsOf(CreateLeagueDTO, {...VALID, name})).toEqual(['name']);
    });

    it.each<[unknown[], string]>([
        [[], 'no competitions'],
        [[1, 2, 3, 4], 'more than 3 competitions'],
        [[2486, 2486], 'a repeated competition'],
        [['2486'], 'a competition id as text']
    ])('rejects %p (%s)', async (competitionIds) => {
        // Expected: between 1 and 3 different integer ids.
        expect(await errorsOf(CreateLeagueDTO, {...VALID, competitionIds})).toEqual(['competitionIds']);
    });

    it('rejects scoring values outside their options', async () => {
        // Expected: a red card can only be -2 or -4 and a goal of a forward 3-5 points.
        const errors = await errorsOf(CreateLeagueDTO, {...VALID, scoring: {...SCORING, redCardPenalty: -3, forwardGoalPoints: 6}});
        expect(errors.sort()).toEqual(['scoring.forwardGoalPoints', 'scoring.redCardPenalty']);
    });

    it('rejects a missing scoring', async () => {
        // Expected: the scoring settings are required.
        const withoutScoring: Partial<typeof VALID> = {...VALID};
        delete withoutScoring.scoring;
        expect(await errorsOf(CreateLeagueDTO, withoutScoring)).toEqual(['scoring']);
    });

    it('rejects a point reward that is not 100k, 200k or 300k', async () => {
        // Expected: only the three allowed rewards per point.
        expect(await errorsOf(CreateLeagueDTO, {...VALID, pointReward: 150_000})).toEqual(['pointReward']);
    });

    it('requires the multiplier settings only when the multipliers are enabled', async () => {
        // Expected: enabled without settings fails in its three fields; enabled with valid settings passes.
        const missing = await errorsOf(CreateLeagueDTO, {...VALID, multipliers: {enabled: true}});
        expect(missing.sort()).toEqual(['multipliers.factor', 'multipliers.finalMatchdays', 'multipliers.target']);

        const valid = await errorsOf(CreateLeagueDTO, {
            ...VALID, multipliers: {enabled: true, finalMatchdays: 5, factor: 2, target: 'CHAMPIONS'}
        });
        expect(valid).toEqual([]);
    });

    it('rejects multiplier settings outside their options', async () => {
        // Expected: final matchdays 3-5 and factor x2 or x3.
        const errors = await errorsOf(CreateLeagueDTO, {
            ...VALID, multipliers: {enabled: true, finalMatchdays: 6, factor: 4, target: 'RELEGATION'}
        });
        expect(errors.sort()).toEqual(['multipliers.factor', 'multipliers.finalMatchdays']);
    });

    it('accepts no team name and rejects a too short one', async () => {
        // Expected: the team name is optional, but when it is sent it must have 3-30 characters.
        expect(await errorsOf(CreateLeagueDTO, {...VALID, teamName: undefined})).toEqual([]);
        expect(await errorsOf(CreateLeagueDTO, {...VALID, teamName: ' A '})).toEqual(['teamName']);
    });
});

describe('JoinLeagueDTO', () => {
    it('accepts a code in lower case and turns it into upper case', async () => {
        // Expected: no errors and the code in capital letters.
        const dto = plainToInstance(JoinLeagueDTO, {joinCode: ' abc234 '});
        expect(await validate(dto)).toEqual([]);
        expect(dto.joinCode).toBe('ABC234');
    });

    it.each(['ABC23', 'ABC2345', 'ABC-23'])('rejects the code %p', async (joinCode) => {
        // Expected: the code has exactly 6 letters or digits.
        expect(await errorsOf(JoinLeagueDTO, {joinCode})).toEqual(['joinCode']);
    });
});

describe('RenameLeagueDTO', () => {
    it('validates the new name like the creation', async () => {
        // Expected: 3-30 characters once trimmed.
        expect(await errorsOf(RenameLeagueDTO, {name: ' Nueva liga '})).toEqual([]);
        expect(await errorsOf(RenameLeagueDTO, {name: '  '})).toEqual(['name']);
    });
});
