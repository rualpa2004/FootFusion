import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, Repository} from "typeorm";
import {LeagueScoring} from "../entities/league-scoring.entity";

@Injectable()
export class LeagueScoringRepository {

    constructor(
        @InjectRepository(LeagueScoring)
        private readonly repository: Repository<LeagueScoring>
    ) {}

    findByLeague(leagueId: number): Promise<LeagueScoring | null> {
        return this.repository.findOne({where: {leagueId}});
    }

    create(data: Partial<LeagueScoring>, manager?: EntityManager): Promise<LeagueScoring> {
        const repository = manager ? manager.getRepository(LeagueScoring) : this.repository;
        return repository.save(repository.create(data));
    }
}
