import {cert, getApps, initializeApp, App} from 'firebase-admin/app';
import * as path from 'path';

export function initializeFirebase(): App {
    const existingApps = getApps();
    if (existingApps.length > 0) {
        return existingApps[0];
    }

    const serviceAccountPath = path.resolve(
        process.cwd(),
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? 'secrets/firebase-service-account.json'
    );

    return initializeApp({
        credential: cert(serviceAccountPath)
    });
}