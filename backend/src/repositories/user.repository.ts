import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class UserRepository {
    
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>
    ) {}

    findAll(): Promise<User[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<User | null> {
        return this.repository.findOne({where: {id}});
    }

    findByFirebaseUid(firebaseUid: string): Promise<User | null> {
        return this.repository.findOne({where: {firebaseUid}});
    }

    findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({where: {email}});
    }

    create(data: Partial<User>): Promise<User> {
        const user = this.repository.create(data);
        return this.repository.save(user);
    }

    save(user: User): Promise<User> {
        return this.repository.save(user);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}