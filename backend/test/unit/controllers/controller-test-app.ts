import { ExecutionContext, INestApplication, Provider, Type, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { App } from "supertest/types";
import { FirebaseAuthGuard } from "../../../src/auth/firebase-auth.guard";

// The authenticated user of every request made to the test application
const TEST_UID = 'uid-1';

// Test application of a controller, shared by the controller specs: its services are replaced by the given ones,
export async function createControllerApp(controller: Type, providers: Provider[]): Promise<INestApplication<App>> {
    const module = await Test.createTestingModule({controllers: [controller], providers})
        .overrideGuard(FirebaseAuthGuard)
        .useValue({canActivate: (context: ExecutionContext) => {
            context.switchToHttp().getRequest<{firebaseUid?: string}>().firebaseUid = TEST_UID;
            return true;
        }})
        .compile();

    const app = module.createNestApplication<INestApplication<App>>();
    app.useGlobalPipes(new ValidationPipe({whitelist: true}));
    await app.init();
    return app;
}
