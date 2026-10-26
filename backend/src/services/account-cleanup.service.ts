import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { UserRepository } from "../repositories/user.repository";

const HOUR_MS = 60 * 60 * 1000;

export const INCOMPLETE_ACCOUNT_MAX_AGE_MS = HOUR_MS;           //Unfinished Google sign-up maximum time

export const UNVERIFIED_ACCOUNT_MAX_AGE_MS = 48 * HOUR_MS;      //Unverified email sign-up maximum time

// Limit of the Firebase Admin API per request (1000 uids/deleteUsers call, defined cause Firebase don't split it himself).
const DELETE_USERS_BATCH_SIZE = 1000;

export interface CleanupResult {
    incompleteAccountsDeleted: number;
    unverifiedAccountsDeleted: number;
}

/**
 * Removes the accounts of sign-ups that were never completed, so no data is kept from them:
 * - Firebase accounts without a profile in the database after 1 hour (Google sign-up abandoned in /completar-perfil).
 * - Email/password accounts not verified after 48 hours (Firebase account and database profile).
 */
@Injectable()
export class AccountCleanupService {
    private readonly logger = new Logger(AccountCleanupService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async removeIncompleteAccounts(now: number = Date.now()): Promise<CleanupResult | null> {
        if (this.configService.get<string>('CLEANUP_JOBS_ENABLED') === 'false') {
            return null;
        }

        try {
            const result = await this.cleanUp(now);
            this.logger.log(
                `Cleanup finished: ${result.incompleteAccountsDeleted} accounts without profile and ` +
                `${result.unverifiedAccountsDeleted} unverified accounts deleted`
            );
            return result;
        } catch (error) {
            // A failed run don't stop the application: the next run will try again.
            this.logger.error('Account cleanup failed', error instanceof Error ? error.stack : error);
            return null;
        }
    }

    private async cleanUp(now: number): Promise<CleanupResult> {
        const profiles = await this.userRepository.findFirebaseIdentities();
        const profileIdByUid = new Map(profiles.map((profile) => [profile.firebaseUid, profile.id]));

        const incompleteUids: string[] = [];
        const unverifiedUids: string[] = [];

        for (const account of await this.listAllFirebaseAccounts()) {
            const age = now - Date.parse(account.metadata.creationTime);

            if (!profileIdByUid.has(account.uid)) {
                if (age > INCOMPLETE_ACCOUNT_MAX_AGE_MS) incompleteUids.push(account.uid);
            } else if (this.isUnverifiedEmailAccount(account) && age > UNVERIFIED_ACCOUNT_MAX_AGE_MS) {
                unverifiedUids.push(account.uid);
            }
        }

        // The profile is deleted before the Firebase account: if the Firebase deletion fails, the account
        // is left without a profile and the next run removes it as an incomplete account.
        for (const uid of unverifiedUids) {
            await this.userRepository.delete(profileIdByUid.get(uid)!);
        }
        await this.deleteFirebaseAccounts([...incompleteUids, ...unverifiedUids]);

        return {
            incompleteAccountsDeleted: incompleteUids.length,
            unverifiedAccountsDeleted: unverifiedUids.length
        };
    }

    /** Google accounts are always verified, so only email/password accounts can be unverified. */
    private isUnverifiedEmailAccount(account: UserRecord): boolean {
        return !account.emailVerified && account.providerData.some((provider) => provider.providerId === 'password');
    }

    private async listAllFirebaseAccounts(): Promise<UserRecord[]> {
        const accounts: UserRecord[] = [];
        let pageToken: string | undefined;

        do {
            const page = await getAuth().listUsers(1000, pageToken);    //1000 is the Firebase limit for one page
            accounts.push(...page.users);
            pageToken = page.pageToken;
        } while (pageToken);

        return accounts;
    }

    private async deleteFirebaseAccounts(uids: string[]): Promise<void> {
        for (let start = 0; start < uids.length; start += DELETE_USERS_BATCH_SIZE) {
            const result = await getAuth().deleteUsers(uids.slice(start, start + DELETE_USERS_BATCH_SIZE));
            for (const failure of result.errors) {
                this.logger.warn(`Could not delete a Firebase account: ${failure.error.message}`);
            }
        }
    }
}
