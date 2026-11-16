import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ALLOW_UNVERIFIED_EMAIL_KEY } from "../../../src/auth/allow-unverified-email.decorator";
import { FirebaseAuthGuard } from "../../../src/auth/firebase-auth.guard";

jest.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        verifyIdToken: (token: string) => mockVerifyIdToken(token)
    })
}))

const mockVerifyIdToken = jest.fn();

describe('FirebaseAuthGuard', () => {
    let guard: FirebaseAuthGuard;
    let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

    const handler = () => undefined;
    class TestController {}

    const buildContext = (authorization?: string) => {
        const request: Record<string, unknown> = {
            headers: authorization ? { authorization } : {}
        };
        const context = {
            switchToHttp: () => ({getRequest: () => request}),
            getHandler: () => handler,
            getClass: () => TestController
        } as unknown as ExecutionContext;

        return {context, request};
    };

    beforeEach(() => {
        mockVerifyIdToken.mockReset();
        reflector = {getAllAndOverride: jest.fn().mockReturnValue(undefined)};
        guard = new FirebaseAuthGuard(reflector as unknown as Reflector);
    });

    it('throws UnauthorizedException when the Authorizaton header is missing', async () => {
        const {context} = buildContext();

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the header is not a Bearer token', async () => {
        const {context} = buildContext('Basic abc123');

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when Firebase rejects the token', async () => {
        mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));
        const {context} = buildContext('Bearer bad-token');

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        expect(mockVerifyIdToken).toHaveBeenCalledWith("bad-token");
    });

    it('returns true and sets firebaseUid and firebaseEmail when the token is valid and the email verified', async () => {
        mockVerifyIdToken.mockResolvedValue({uid: 'uid-123', email: 'ana@gmail.com', email_verified: true});
        const {context, request} = buildContext('Bearer good-token');

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockVerifyIdToken).toHaveBeenCalledWith('good-token');
        expect(request.firebaseUid).toBe('uid-123');
        expect(request.firebaseEmail).toBe('ana@gmail.com');
    });

    it('throws ForbiddenException when the email is not verified', async () => {
        mockVerifyIdToken.mockResolvedValue({uid: 'uid-123', email: 'ana@gmail.com', email_verified: false});
        const {context, request} = buildContext('Bearer good-token');

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        expect(request.firebaseUid).toBeUndefined();
    });

    it('accepts an unverified email on routes marked with @AllowUnverifiedEmail()', async () => {
        mockVerifyIdToken.mockResolvedValue({uid: 'uid-123', email: 'ana@gmail.com', email_verified: false});
        reflector.getAllAndOverride.mockReturnValue(true);
        const {context, request} = buildContext('Bearer good-token');

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(request.firebaseUid).toBe('uid-123');
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ALLOW_UNVERIFIED_EMAIL_KEY, [handler, TestController]);
    });
})
