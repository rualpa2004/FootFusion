import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { type AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { UserService } from "../services/user.service";
import { CreateUserDTO } from "../dtos/user/create-user.dto";
import { UserResponseDTO } from "../dtos/user/user-response.dto";



@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UserController {
    constructor (private readonly userService: UserService) {}

    @Post()
    register(
        @Body() dto: CreateUserDTO,
        @Req() req: AuthenticatedRequest
    ): Promise<UserResponseDTO> {
        return this.userService.register(req.firebaseUid!, req.firebaseEmail!, dto);
    }

    @Get('me')
    getProfile(@Req() req: AuthenticatedRequest): Promise<UserResponseDTO> {
        return this.userService.findByFirebaseUid(req.firebaseUid!);
    }
}