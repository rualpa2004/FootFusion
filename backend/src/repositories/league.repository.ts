import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {League} from "../entities/league.entity";

@Injectable()
export class LeagueRepository {

    constructor(
        @InjectRepository(League)
        private readonly repository: Repository<League>
    ) {}

    findAll(): Promise<League[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<League | null> {
        return this.repository.findOne({where: {id}});
    }

    findByJoinCode(joinCode: string): Promise<League | null> {
        return this.repository.findOne({where: {joinCode}});
    }

    // competitionIds is a simple-array (comma-separated string in MySQL)
    findByCompetitionId(competitionId: string): Promise<League[]> {
        return this.repository.createQueryBuilder("league")
            .where("FIND_IN_SET(:competitionId, league.competitionIds) > 0", {competitionId})
            .getMany();
    }

    create(data: Partial<League>): Promise<League> {
        const league = this.repository.create(data);
        return this.repository.save(league);
    }

    save(league: League): Promise<League> {
        return this.repository.save(league);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
