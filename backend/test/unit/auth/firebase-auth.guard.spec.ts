import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FirebaseAuthGuard } from "../../../src/auth/firebase-auth.guard";

jest.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        verifyIdToken: (token: string) => mockVerifyIdToken(token)
    })
}))

const mockVerifyIdToken = jest.fn();

describe('FirebaseAuthGuard', () => {
    let guard: FirebaseAuthGuard;

    const buildContext = (authorization?: string) => {
        const request: Record<string, unknown> = {
            headers: authorization ? { authorization } : {}
        };
        const context = {
            switchToHttp: () => ({getRequest: () => request})
        } as unknown as ExecutionContext;

        return {context, request};
    };

    beforeEach(() => {
        mockVerifyIdToken.mockReset();
        guard = new FirebaseAuthGuard();
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

    it('returns true and sets firebaseUid and firebaseEmail when the token is valid', async () => {
        mockVerifyIdToken.mockResolvedValue({uid: 'uid-123', email: 'ana@gmail.com'});
        const {context, request} = buildContext('Bearer good-token');

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockVerifyIdToken).toHaveBeenCalledWith('good-token');
        expect(request.firebaseUid).toBe('uid-123');
        expect(request.firebaseEmail).toBe('ana@gmail.com');
    });
})