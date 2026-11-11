import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, Repository} from "typeorm";
import {LeagueBan} from "../entities/league-ban.entity";

@Injectable()
export class LeagueBanRepository {

    constructor(
        @InjectRepository(LeagueBan)
        private readonly repository: Repository<LeagueBan>
    ) {}

    existsByLeagueAndUser(leagueId: number, userId: number, manager?: EntityManager): Promise<boolean> {
        const repository = manager ? manager.getRepository(LeagueBan) : this.repository;
        return repository.exists({where: {leagueId, userId}});
    }
}
