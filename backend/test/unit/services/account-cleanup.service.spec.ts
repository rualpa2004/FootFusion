import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRecord } from "firebase-admin/auth";
import {
    AccountCleanupService,
    INCOMPLETE_ACCOUNT_MAX_AGE_MS,
    UNVERIFIED_ACCOUNT_MAX_AGE_MS
} from "../../../src/services/account-cleanup.service";
import { UserRepository } from "../../../src/repositories/user.repository";

jest.mock('../../../src/repositories/user.repository', () => ({
    UserRepository: class UserRepository {},
}));

// @nestjs/config and @nestjs/schedule are published as ES modules, which Jest (CommonJS) cannot load.
// The service only needs the ConfigService type and the @Cron decorator, so both are replaced.
jest.mock('@nestjs/config', () => ({
    ConfigService: class ConfigService {},
}));
jest.mock('@nestjs/schedule', () => ({
    Cron: () => () => undefined,
    CronExpression: {EVERY_HOUR: '0 0-23/1 * * *'},
}));

const mockListUsers = jest.fn();
const mockDeleteUsers = jest.fn();

jest.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        listUsers: (maxResults: number, pageToken?: string) => mockListUsers(maxResults, pageToken),
        deleteUsers: (uids: string[]) => mockDeleteUsers(uids)
    })
}));

const NOW = new Date('2026-10-24T12:00:00Z').getTime();
const MINUTE_MS = 60 * 1000;

const buildAccount = ({
    uid,
    ageMs,
    emailVerified = true,
    provider = 'google.com'
}: {uid: string; ageMs: number; emailVerified?: boolean; provider?: string}): UserRecord => ({
    uid,
    emailVerified,
    providerData: [{providerId: provider}],
    metadata: {creationTime: new Date(NOW - ageMs).toUTCString()}
}) as unknown as UserRecord;

describe('AccountCleanupService', () => {
    let service: AccountCleanupService;
    let userRepository: jest.Mocked<Pick<UserRepository, 'findFirebaseIdentities' | 'delete'>>;
    let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

    const givenFirebaseAccounts = (...accounts: UserRecord[]) => {
        mockListUsers.mockResolvedValue({users: accounts, pageToken: undefined});
    };

    const givenProfiles = (...profiles: {id: number; firebaseUid: string}[]) => {
        userRepository.findFirebaseIdentities.mockResolvedValue(profiles);
    };

    beforeEach(() => {
        mockListUsers.mockReset();
        mockDeleteUsers.mockReset().mockResolvedValue({successCount: 0, failureCount: 0, errors: []});
        userRepository = {findFirebaseIdentities: jest.fn().mockResolvedValue([]), delete: jest.fn()};
        configService = {get: jest.fn().mockReturnValue(undefined)};
        service = new AccountCleanupService(
            userRepository as unknown as UserRepository,
            configService as unknown as ConfigService
        );
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('accounts without profile (unfinished Google sign-up)', () => {
        it('deletes them from Firebase after 1 hour', async () => {
            givenFirebaseAccounts(buildAccount({uid: 'old-google', ageMs: INCOMPLETE_ACCOUNT_MAX_AGE_MS + MINUTE_MS}));

            const result = await service.removeIncompleteAccounts(NOW);

            expect(mockDeleteUsers).toHaveBeenCalledWith(['old-google']);
            expect(result).toEqual({incompleteAccountsDeleted: 1, unverifiedAccountsDeleted: 0});
        });

        it('keeps them during the first hour, while the user may still be choosing the name', async () => {
            givenFirebaseAccounts(buildAccount({uid: 'new-google', ageMs: 30 * MINUTE_MS}));

            const result = await service.removeIncompleteAccounts(NOW);

            expect(mockDeleteUsers).not.toHaveBeenCalled();
            expect(result).toEqual({incompleteAccountsDeleted: 0, unverifiedAccountsDeleted: 0});
        });
    });

    describe('unverified email accounts', () => {
        it('deletes the profile and the Firebase account after 48 hours', async () => {
            givenFirebaseAccounts(buildAccount({
                uid: 'unverified', ageMs: UNVERIFIED_ACCOUNT_MAX_AGE_MS + MINUTE_MS, emailVerified: false, provider: 'password'
            }));
            givenProfiles({id: 7, firebaseUid: 'unverified'});

            const result = await service.removeIncompleteAccounts(NOW);

            expect(userRepository.delete).toHaveBeenCalledWith(7);
            expect(mockDeleteUsers).toHaveBeenCalledWith(['unverified']);
            expect(result).toEqual({incompleteAccountsDeleted: 0, unverifiedAccountsDeleted: 1});
        });

        it('deletes the profile before the Firebase account', async () => {
            givenFirebaseAccounts(buildAccount({
                uid: 'unverified', ageMs: UNVERIFIED_ACCOUNT_MAX_AGE_MS + MINUTE_MS, emailVerified: false, provider: 'password'
            }));
            givenProfiles({id: 7, firebaseUid: 'unverified'});

            await service.removeIncompleteAccounts(NOW);

            expect(userRepository.delete.mock.invocationCallOrder[0])
                .toBeLessThan(mockDeleteUsers.mock.invocationCallOrder[0]);
        });

        it('keeps them during the first 48 hours, so the user has time to open the email', async () => {
            givenFirebaseAccounts(buildAccount({
                uid: 'unverified', ageMs: 47 * 60 * MINUTE_MS, emailVerified: false, provider: 'password'
            }));
            givenProfiles({id: 7, firebaseUid: 'unverified'});

            await service.removeIncompleteAccounts(NOW);

            expect(userRepository.delete).not.toHaveBeenCalled();
            expect(mockDeleteUsers).not.toHaveBeenCalled();
        });
    });

    it('never deletes complete accounts, however old they are', async () => {
        givenFirebaseAccounts(
            buildAccount({uid: 'verified-email', ageMs: 30 * 24 * 60 * MINUTE_MS, provider: 'password'}),
            buildAccount({uid: 'google', ageMs: 30 * 24 * 60 * MINUTE_MS})
        );
        givenProfiles({id: 1, firebaseUid: 'verified-email'}, {id: 2, firebaseUid: 'google'});

        const result = await service.removeIncompleteAccounts(NOW);

        expect(userRepository.delete).not.toHaveBeenCalled();
        expect(mockDeleteUsers).not.toHaveBeenCalled();
        expect(result).toEqual({incompleteAccountsDeleted: 0, unverifiedAccountsDeleted: 0});
    });

    it('reads every page of Firebase accounts', async () => {
        const oldAge = INCOMPLETE_ACCOUNT_MAX_AGE_MS + MINUTE_MS;
        mockListUsers
            .mockResolvedValueOnce({users: [buildAccount({uid: 'page-1', ageMs: oldAge})], pageToken: 'next'})
            .mockResolvedValueOnce({users: [buildAccount({uid: 'page-2', ageMs: oldAge})], pageToken: undefined});

        await service.removeIncompleteAccounts(NOW);

        expect(mockListUsers).toHaveBeenNthCalledWith(2, 1000, 'next');
        expect(mockDeleteUsers).toHaveBeenCalledWith(['page-1', 'page-2']);
    });

    it('does nothing when CLEANUP_JOBS_ENABLED is false', async () => {
        configService.get.mockReturnValue('false');

        const result = await service.removeIncompleteAccounts(NOW);

        expect(result).toBeNull();
        expect(mockListUsers).not.toHaveBeenCalled();
    });

    it('logs the failure instead of throwing when Firebase is not reachable', async () => {
        mockListUsers.mockRejectedValue(new Error('Network error'));

        await expect(service.removeIncompleteAccounts(NOW)).resolves.toBeNull();
        expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('logs the accounts that Firebase could not delete', async () => {
        givenFirebaseAccounts(buildAccount({uid: 'old-google', ageMs: INCOMPLETE_ACCOUNT_MAX_AGE_MS + MINUTE_MS}));
        mockDeleteUsers.mockResolvedValue({
            successCount: 0, failureCount: 1, errors: [{index: 0, error: {message: 'Internal error'}}]
        });

        await service.removeIncompleteAccounts(NOW);

        expect(Logger.prototype.warn).toHaveBeenCalledWith('Could not delete a Firebase account: Internal error');
    });
});
