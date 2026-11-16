import { ExecutionContext, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { LeagueController } from "../../../src/controllers/league.controller";
import { LeagueService } from "../../../src/services/league.service";
import { FirebaseAuthGuard } from "../../../src/auth/firebase-auth.guard";

// The real service needs the repositories (ES modules Jest can not load); the controller only needs its class.
jest.mock('../../../src/services/league.service', () => ({LeagueService: class LeagueService {}}));
// The guard imports firebase-admin, which loads ES modules; the guard itself is replaced below.
jest.mock('firebase-admin/auth', () => ({getAuth: jest.fn()}));

const SCORING = {
    minutesMaxPoints: 3, forwardGoalPoints: 4, assistPoints: 3, defenderCleanSheetPoints: 4, goalsConcededPenalty: -1,
    yellowCardPenalty: -1, redCardPenalty: -2, missedPenaltyPenalty: -2, ownGoalPenalty: -2, duelsWonPoints: 1,
    foulsCommittedPenalty: -1
};
const VALID_LEAGUE = {
    name: ' Liga de amigos ', competitionIds: [119924], scoring: SCORING, pointReward: 300_000,
    captainEnabled: true, multipliers: {enabled: false}
};

describe('LeagueController', () => {
    let app: INestApplication<App>;
    let leagueService: Record<string, jest.Mock>;

    beforeEach(async () => {
        leagueService = {
            create: jest.fn().mockResolvedValue({league: {id: 1}}),
            join: jest.fn().mockResolvedValue({league: {id: 2}}),
            findMine: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({id: 3}),
            rename: jest.fn().mockResolvedValue({id: 3})
        };

        const module = await Test.createTestingModule({
            controllers: [LeagueController],
            providers: [{provide: LeagueService, useValue: leagueService}]
        })
            // Firebase is replaced: every request is authenticated as uid-1
            .overrideGuard(FirebaseAuthGuard)
            .useValue({canActivate: (context: ExecutionContext) => {
                context.switchToHttp().getRequest<{firebaseUid?: string}>().firebaseUid = 'uid-1';
                return true;
            }})
            .compile();

        app = module.createNestApplication();
        // Same pipe as main.ts
        app.useGlobalPipes(new ValidationPipe({whitelist: true}));
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /leagues creates a league for the authenticated user', async () => {
        // Expected: 201 and the service receives the uid and the trimmed name, without unknown fields.
        await request(app.getHttpServer())
            .post('/leagues')
            .send({...VALID_LEAGUE, initialBudget: 1})
            .expect(201)
            .expect({league: {id: 1}});

        const [uid, dto] = leagueService.create.mock.calls[0] as [string, {name: string}];
        expect(uid).toBe('uid-1');
        expect(dto.name).toBe('Liga de amigos');
        expect(dto).not.toHaveProperty('initialBudget');
    });

    it('POST /leagues rejects an invalid league without calling the service', async () => {
        // Expected: 400 for 4 competitions; the service is not called.
        await request(app.getHttpServer())
            .post('/leagues')
            .send({...VALID_LEAGUE, competitionIds: [1, 2, 3, 4]})
            .expect(400);

        expect(leagueService.create).not.toHaveBeenCalled();
    });

    it('POST /leagues/join joins with the code in upper case', async () => {
        // Expected: 201 and the code is sent to the service in capital letters (the route is not taken as an id).
        await request(app.getHttpServer())
            .post('/leagues/join')
            .send({joinCode: 'abc234'})
            .expect(201);

        expect(leagueService.join).toHaveBeenCalledWith('uid-1', {joinCode: 'ABC234'});
    });

    it('GET /leagues lists the leagues of the user', async () => {
        // Expected: 200 and the service is called with the uid.
        await request(app.getHttpServer()).get('/leagues').expect(200).expect([]);

        expect(leagueService.findMine).toHaveBeenCalledWith('uid-1');
    });

    it('GET /leagues/:id returns a league and rejects ids that are not numbers', async () => {
        // Expected: 200 for /leagues/3 and 400 for /leagues/abc.
        await request(app.getHttpServer()).get('/leagues/3').expect(200).expect({id: 3});
        await request(app.getHttpServer()).get('/leagues/abc').expect(400);

        expect(leagueService.findOne).toHaveBeenCalledTimes(1);
        expect(leagueService.findOne).toHaveBeenCalledWith('uid-1', 3);
    });

    it('PATCH /leagues/:id/name renames the league', async () => {
        // Expected: 200 and the service receives the league id and the trimmed name.
        await request(app.getHttpServer())
            .patch('/leagues/3/name')
            .send({name: ' Nueva liga '})
            .expect(200);

        expect(leagueService.rename).toHaveBeenCalledWith('uid-1', 3, {name: 'Nueva liga'});
    });
});
