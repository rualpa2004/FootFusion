import { CompetitionService } from "../../../src/services/competition.service";

jest.mock('../../../src/repositories/sports-data.repository', () => ({SportsDataRepository: class SportsDataRepository {}}));

describe('CompetitionService', () => {
    it('returns the competitions of MongoDB', async () => {
        // Expected: one DTO per competition with its id, name, logo and country.
        const sportsDataRepository = {
            findCompetitions: jest.fn().mockResolvedValue([
                {id: 2486, name: 'UEFA Champions League', logo: 'cl.png', countryName: 'World'}
            ])
        };
        const service = new CompetitionService(sportsDataRepository as never);

        const result = await service.findAll();

        expect(result).toEqual([{id: 2486, name: 'UEFA Champions League', logo: 'cl.png', countryName: 'World'}]);
    });
});
