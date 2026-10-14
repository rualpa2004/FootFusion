import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { UserRepository } from "../repositories/user.repository";
import { UserController } from "../controllers/user.controller";
import { UserService } from "../services/user.service";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [UserRepository, UserService],
    exports: [UserRepository, UserService]
})
export class UserModule {}