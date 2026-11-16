import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { Request } from "express";
import { ALLOW_UNVERIFIED_EMAIL_KEY } from "./allow-unverified-email.decorator";

export interface AuthenticatedRequest extends Request {
    firebaseUid?: string;
    firebaseEmail?: string;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException("There is no authentication token");
        }

        let decodedToken: DecodedIdToken;
        try {
            decodedToken = await getAuth().verifyIdToken(token);
        } catch {
            throw new UnauthorizedException("Invalid or expired authentication token");
        }

        // Accounts must verify their email before using the API (Google accounts are already verified).
        if (!decodedToken.email_verified && !this.allowsUnverifiedEmail(context)) {
            throw new ForbiddenException("The email address has not been verified");
        }

        request.firebaseUid = decodedToken.uid;
        request.firebaseEmail = decodedToken.email;
        return true;
    }

    private allowsUnverifiedEmail(context: ExecutionContext): boolean {
        return this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_EMAIL_KEY, [
            context.getHandler(),
            context.getClass()
        ]) ?? false;
    }

    private extractToken(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type == 'Bearer' ? token : undefined;
    }
}
