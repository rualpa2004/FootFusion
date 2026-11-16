import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, Repository} from "typeorm";
import {LeagueCompetition} from "../entities/league-competition.entity";

@Injectable()
export class LeagueCompetitionRepository {

    constructor(
        @InjectRepository(LeagueCompetition)
        private readonly repository: Repository<LeagueCompetition>
    ) {}

    async createMany(leagueId: number, competitionIds: number[], manager?: EntityManager): Promise<void> {
        const repository = manager ? manager.getRepository(LeagueCompetition) : this.repository;
        await repository.insert(competitionIds.map((competitionId) => ({leagueId, competitionId})));
    }

    // Leagues that use a competition (needed to score a matchday of that competition)
    async findLeagueIdsByCompetition(competitionId: number): Promise<number[]> {
        const rows = await this.repository.find({where: {competitionId}, select: {leagueId: true}});
        return rows.map((row) => row.leagueId);
    }
}
