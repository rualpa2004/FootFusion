import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserDTO } from "../dtos/user/create-user.dto";
import { UserResponseDTO } from "../dtos/user/user-response.dto";
import { UpdateUserDTO } from "../dtos/user/update-user.dto";
import { User } from "../entities/user.entity";

@Injectable()
export class UserService {
    constructor (private readonly userRepository: UserRepository) {}

    async register(firebaseUid: string, email: string, dto: CreateUserDTO): Promise<UserResponseDTO> {
        const existing = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (existing) {
            throw new ConflictException("There is an user registered with this firebaseUid");
        }

        const user = await this.userRepository.create({
            firebaseUid,
            email,
            name: dto.name
        })

        return new UserResponseDTO(user);
    }

    async findByFirebaseUid(firebaseUid: string): Promise<UserResponseDTO> {
        return new UserResponseDTO(await this.findUser(firebaseUid));
    }

    // Changes the profile of the authenticated user (only the manager name, already trimmed and validated by the DTO)
    async updateProfile(firebaseUid: string, dto: UpdateUserDTO): Promise<UserResponseDTO> {
        const user = await this.findUser(firebaseUid);
        user.name = dto.name;
        return new UserResponseDTO(await this.userRepository.save(user));
    }

    private async findUser(firebaseUid: string): Promise<User> {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }
}