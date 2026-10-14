import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserDTO } from "../dtos/user/create-user.dto";
import { UserResponseDTO } from "../dtos/user/user-response.dto";

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
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        return new UserResponseDTO(user);
    }
}