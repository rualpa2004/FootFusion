import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {History, HistoryEntryType} from "../entities/history.entity";

@Injectable()
export class HistoryRepository {

    constructor(
        @InjectRepository(History)
        private readonly repository: Repository<History>
    ) {}

    findAll(): Promise<History[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<History | null> {
        return this.repository.findOne({where: {id}});
    }

    findByPlayerProperty(playerPropertyId: number): Promise<History[]> {
        return this.repository.find({
            where: {playerPropertyId},
            relations: {user: true, previousOwner: true},
            order: {date: "DESC"}
        });
    }

    // Both acquisitions and sales of the user
    findByUser(userId: number): Promise<History[]> {
        return this.repository.find({
            where: [{userId}, {previousOwnerId: userId}],
            relations: {playerProperty: true, user: true, previousOwner: true},
            order: {date: "DESC"}
        });
    }

    findByType(type: HistoryEntryType): Promise<History[]> {
        return this.repository.find({where: {type}, order: {date: "DESC"}});
    }

    create(data: Partial<History>): Promise<History> {
        const history = this.repository.create(data);
        return this.repository.save(history);
    }

    save(history: History): Promise<History> {
        return this.repository.save(history);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
