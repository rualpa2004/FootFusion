import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {IsNull, Repository} from "typeorm";
import {PlayerProperty} from "../entities/player-property.entity";

@Injectable()
export class PlayerPropertyRepository {

    constructor(
        @InjectRepository(PlayerProperty)
        private readonly repository: Repository<PlayerProperty>
    ) {}

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

    findFreeAgents(leagueId: number): Promise<PlayerProperty[]> {
        return this.repository.find({where: {leagueId, teamFantasyId: IsNull()}});
    }

    countPlayersByTeamFantasy(teamFantasyId: number): Promise<number> {
        return this.repository.count({where: {teamFantasyId}});
    }

    create(data: Partial<PlayerProperty>): Promise<PlayerProperty> {
        const playerProperty = this.repository.create(data);
        return this.repository.save(playerProperty);
    }

    save(playerProperty: PlayerProperty): Promise<PlayerProperty> {
        return this.repository.save(playerProperty);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
