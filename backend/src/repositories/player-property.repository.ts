import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, IsNull, Repository} from "typeorm";
import {PlayerProperty} from "../entities/player-property.entity";

// Rows inserted per query when a league is created
const INSERT_CHUNK_SIZE = 500;

@Injectable()
export class PlayerPropertyRepository {

    constructor(
        @InjectRepository(PlayerProperty)
        private readonly repository: Repository<PlayerProperty>
    ) {}

    // Inside a transaction the queries must use its entity manager
    private repo(manager?: EntityManager): Repository<PlayerProperty> {
        return manager ? manager.getRepository(PlayerProperty) : this.repository;
    }

    findAll(): Promise<PlayerProperty[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<PlayerProperty | null> {
        return this.repository.findOne({where: {id}});
    }

    findByTeamFantasy(teamFantasyId: number): Promise<PlayerProperty[]> {
        return this.repository.find({where: {teamFantasyId}});
    }

    // One result per league the real player exists in
    findByExternalPlayerId(externalPlayerId: number): Promise<PlayerProperty[]> {
        return this.repository.find({where: {externalPlayerId}});
    }

    findByExternalPlayerIdAndLeague(externalPlayerId: number, leagueId: number): Promise<PlayerProperty | null> {
        return this.repository.findOne({where: {externalPlayerId, leagueId}});
    }

    findFreeAgents(leagueId: number, manager?: EntityManager): Promise<PlayerProperty[]> {
        return this.repo(manager).find({where: {leagueId, teamFantasyId: IsNull()}});
    }

    countPlayersByTeamFantasy(teamFantasyId: number): Promise<number> {
        return this.repository.count({where: {teamFantasyId}});
    }

    async insertMany(rows: Partial<PlayerProperty>[], manager?: EntityManager): Promise<void> {
        const repository = this.repo(manager);
        for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
            await repository.insert(rows.slice(start, start + INSERT_CHUNK_SIZE));
        }
    }

    create(data: Partial<PlayerProperty>): Promise<PlayerProperty> {
        const playerProperty = this.repository.create(data);
        return this.repository.save(playerProperty);
    }

    save(playerProperty: PlayerProperty): Promise<PlayerProperty> {
        return this.repository.save(playerProperty);
    }

    saveMany(playerProperties: PlayerProperty[], manager?: EntityManager): Promise<PlayerProperty[]> {
        return this.repo(manager).save(playerProperties);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
