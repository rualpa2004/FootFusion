import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, Repository} from "typeorm";
import {League} from "../entities/league.entity";

@Injectable()
export class LeagueRepository {

    constructor(
        @InjectRepository(League)
        private readonly repository: Repository<League>
    ) {}

    // Inside a transaction the queries must use its entity manager
    private repo(manager?: EntityManager): Repository<League> {
        return manager ? manager.getRepository(League) : this.repository;
    }

    findAll(): Promise<League[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<League | null> {
        return this.repository.findOne({where: {id}});
    }

    // League with its competitions and scoring settings
    findByIdWithSettings(id: number): Promise<League | null> {
        return this.repository.findOne({where: {id}, relations: {competitions: true, scoring: true}});
    }

    findByJoinCode(joinCode: string): Promise<League | null> {
        return this.repository.findOne({where: {joinCode}});
    }

    // Locks the league row until the transaction ends, so two users joining at the same time can not exceed the maximum of teams nor get the same players
    findByJoinCodeForUpdate(joinCode: string, manager: EntityManager): Promise<League | null> {
        return manager.getRepository(League).findOne({where: {joinCode}, lock: {mode: 'pessimistic_write'}});
    }

    existsByJoinCode(joinCode: string, manager?: EntityManager): Promise<boolean> {
        return this.repo(manager).exists({where: {joinCode}});
    }

    create(data: Partial<League>, manager?: EntityManager): Promise<League> {
        const repository = this.repo(manager);
        return repository.save(repository.create(data));
    }

    save(league: League): Promise<League> {
        return this.repository.save(league);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
