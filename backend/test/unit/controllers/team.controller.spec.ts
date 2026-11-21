import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { TeamController } from "../../../src/controllers/team.controller";
import { TeamService } from "../../../src/services/team.service";
import { LineupService } from "../../../src/services/lineup.service";
import { createControllerApp } from "./controller-test-app";

// The real services need the repositories (ES modules Jest can not load); the controller only needs their classes.
jest.mock('../../../src/services/team.service', () => ({TeamService: class TeamService {}}));
jest.mock('../../../src/services/lineup.service', () => ({LineupService: class LineupService {}}));

jest.mock('firebase-admin/auth', () => ({getAuth: jest.fn()}));

const VALID_LINEUP = {
    formation: '4-3-3', captainId: 11,
    players: [{slot: 'GK1', playerPropertyId: 1}, {slot: 'FWD1', playerPropertyId: 11}]
};

describe('TeamController', () => {
    let app: INestApplication<App>;
    let teamService: Record<string, jest.Mock>;
    let lineupService: Record<string, jest.Mock>;

    beforeEach(async () => {
        teamService = {getTeam: jest.fn().mockResolvedValue({id: 50})};
        lineupService = {
            getLineup: jest.fn().mockResolvedValue({teamId: 50}),
            saveLineup: jest.fn().mockResolvedValue({teamId: 50})
        };

        // Every request is authenticated as uid-1
        app = await createControllerApp(TeamController, [{provide: TeamService, useValue: teamService}, {provide: LineupService, useValue: lineupService}]);
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /leagues/:id/teams/:teamId returns the team', async () => {
        // Expected: 200 and the service receives the uid, the league and the team as numbers.
        await request(app.getHttpServer()).get('/leagues/3/teams/50').expect(200).expect({id: 50});

        expect(teamService.getTeam).toHaveBeenCalledWith('uid-1', 3, 50);
    });

    it('GET /leagues/:id/teams/:teamId/lineup uses the next matchday when none is given', async () => {
        // Expected: 200 and matchday undefined.
        await request(app.getHttpServer()).get('/leagues/3/teams/50/lineup').expect(200);

        expect(lineupService.getLineup).toHaveBeenCalledWith('uid-1', 3, 50, undefined);
    });

    it('GET /leagues/:id/teams/:teamId/lineup?matchday=12 asks for that matchday', async () => {
        // Expected: 200 and matchday 12 as a number.
        await request(app.getHttpServer()).get('/leagues/3/teams/50/lineup?matchday=12').expect(200);

        expect(lineupService.getLineup).toHaveBeenCalledWith('uid-1', 3, 50, 12);
    });

    it('GET with a non-numeric matchday or team is rejected', async () => {
        // Expected: 400 in both cases and the service is not called.
        await request(app.getHttpServer()).get('/leagues/3/teams/50/lineup?matchday=next').expect(400);
        await request(app.getHttpServer()).get('/leagues/3/teams/abc').expect(400);

        expect(lineupService.getLineup).not.toHaveBeenCalled();
        expect(teamService.getTeam).not.toHaveBeenCalled();
    });

    it('PUT /leagues/:id/lineup saves the lineup without unknown fields', async () => {
        // Expected: 200 and the service receives the lineup without the extra field.
        await request(app.getHttpServer())
            .put('/leagues/3/lineup')
            .send({...VALID_LINEUP, matchday: 4})
            .expect(200)
            .expect({teamId: 50});

        const [uid, leagueId, dto] = lineupService.saveLineup.mock.calls[0] as [string, number, object];
        expect([uid, leagueId]).toEqual(['uid-1', 3]);
        expect(dto).toEqual(VALID_LINEUP);
    });

    it('PUT accepts a lineup without captain', async () => {
        // Expected: 200 with captainId null.
        await request(app.getHttpServer()).put('/leagues/3/lineup').send({...VALID_LINEUP, captainId: null}).expect(200);
    });

    it.each([
        ['an unknown formation', {...VALID_LINEUP, formation: '3-3-4'}],
        ['a wrong slot name', {...VALID_LINEUP, players: [{slot: 'ST1', playerPropertyId: 1}]}],
        ['more than 11 starters', {...VALID_LINEUP, players: Array.from({length: 12}, (_, index) => (
            {slot: 'DEF1', playerPropertyId: index + 1}))}],
        ['a non-numeric player', {...VALID_LINEUP, players: [{slot: 'GK1', playerPropertyId: 'one'}]}],
        ['no players list', {formation: '4-4-2'}]
    ])('PUT rejects %s', async (_case, body) => {
        // Expected: 400 and the service is not called.
        await request(app.getHttpServer()).put('/leagues/3/lineup').send(body).expect(400);

        expect(lineupService.saveLineup).not.toHaveBeenCalled();
    });
});
