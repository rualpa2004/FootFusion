import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {IsNull, MoreThan, Repository} from "typeorm";
import {Ban} from "../entities/ban.entity";

@Injectable()
export class BanRepository {

    constructor(
        @InjectRepository(Ban)
        private readonly repository: Repository<Ban>
    ) {}

    findAll(): Promise<Ban[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<Ban | null> {
        return this.repository.findOne({where: {id}});
    }

    // A ban is in force if it is active and either permanent or not yet expired
    findActiveByTargetUser(targetUserId: number, now: Date = new Date()): Promise<Ban | null> {
        return this.repository.findOne({
            where: [
                {targetUserId, active: true, expiresAt: IsNull()},
                {targetUserId, active: true, expiresAt: MoreThan(now)}
            ]
        });
    }

    findByAdmin(adminId: number): Promise<Ban[]> {
        return this.repository.find({
            where: {adminId},
            relations: {targetUser: true},
            order: {bannedAt: "DESC"}
        });
    }

    create(data: Partial<Ban>): Promise<Ban> {
        const ban = this.repository.create(data);
        return this.repository.save(ban);
    }

    save(ban: Ban): Promise<Ban> {
        return this.repository.save(ban);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
