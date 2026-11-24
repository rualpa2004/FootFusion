import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { UserController } from "../../../src/controllers/user.controller";
import { UserService } from "../../../src/services/user.service";
import { createControllerApp } from "./controller-test-app";

// The real service needs the repositories (ES modules Jest can not load); the controller only needs its class.
jest.mock('../../../src/services/user.service', () => ({UserService: class UserService {}}));
// The guard imports firebase-admin, which loads ES modules; the guard itself is replaced in createControllerApp.
jest.mock('firebase-admin/auth', () => ({getAuth: jest.fn()}));

describe('UserController', () => {
    let app: INestApplication<App>;
    let userService: Record<string, jest.Mock>;

    beforeEach(async () => {
        userService = {
            register: jest.fn().mockResolvedValue({id: 1}),
            findByFirebaseUid: jest.fn().mockResolvedValue({id: 1}),
            updateProfile: jest.fn().mockResolvedValue({id: 1, name: 'Ana la Mánager'})
        };

        // Every request is authenticated as uid-1
        app = await createControllerApp(UserController, [{provide: UserService, useValue: userService}]);
    });

    afterEach(async () => {
        await app.close();
    });

    it('PATCH /users/me changes the name of the authenticated user', async () => {
        // Expected: 200 with the profile; the service receives uid-1 and the trimmed name, without unknown fields.
        await request(app.getHttpServer())
            .patch('/users/me')
            .send({name: '  Ana la Mánager ', email: 'otro@gmail.com', role: 'ADMIN'})
            .expect(200)
            .expect({id: 1, name: 'Ana la Mánager'});

        expect(userService.updateProfile).toHaveBeenCalledWith('uid-1', {name: 'Ana la Mánager'});
    });

    it.each([
        ['too short once trimmed', '  Al  '],
        ['too long', 'A'.repeat(31)],
        ['not a string', 123]
    ])('PATCH /users/me rejects a name %s', async (_case, name) => {
        // Expected: 400 and the service is not called.
        await request(app.getHttpServer()).patch('/users/me').send({name}).expect(400);

        expect(userService.updateProfile).not.toHaveBeenCalled();
    });

    it('PATCH /users/me accepts names of 3 and 30 characters', async () => {
        // Expected: both limits are valid.
        await request(app.getHttpServer()).patch('/users/me').send({name: 'Ana'}).expect(200);
        await request(app.getHttpServer()).patch('/users/me').send({name: 'A'.repeat(30)}).expect(200);

        expect(userService.updateProfile).toHaveBeenCalledTimes(2);
    });

    it('POST /users applies the same rules to the name of a new profile', async () => {
        // Expected: 400 for a 2-character name; 201 with the trimmed name otherwise.
        await request(app.getHttpServer()).post('/users').send({name: 'Al'}).expect(400);
        await request(app.getHttpServer()).post('/users').send({name: ' Ana '}).expect(201);

        expect(userService.register).toHaveBeenCalledTimes(1);
        const [, , dto] = userService.register.mock.calls[0] as [string, string | undefined, {name: string}];
        expect(dto).toEqual({name: 'Ana'});
    });
});
