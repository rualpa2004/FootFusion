import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { getAuth } from "firebase-admin/auth";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
    firebaseUid?: string;
    firebaseEmail?: string;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException("There is no authentication token");
        }

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            request.firebaseUid = decodedToken.uid;
            request.firebaseEmail = decodedToken.email;
            return true;
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired authentication token");
        }
    }

    private extractToken(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type == 'Bearer' ? token : undefined;
    }
}