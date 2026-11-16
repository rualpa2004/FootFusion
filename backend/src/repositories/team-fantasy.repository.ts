import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, In, Repository} from "typeorm";
import {TeamFantasy} from "../entities/team-fantasy.entity";

@Injectable()
export class TeamFantasyRepository {

    constructor(
        @InjectRepository(TeamFantasy)
        private readonly repository: Repository<TeamFantasy>
    ) {}

    // Inside a transaction the queries must use its entity manager
    private repo(manager?: EntityManager): Repository<TeamFantasy> {
        return manager ? manager.getRepository(TeamFantasy) : this.repository;
    }

    findAll(): Promise<TeamFantasy[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<TeamFantasy | null> {
        return this.repository.findOne({where: {id}});
    }

    findByIdWithPlayers(id: number): Promise<TeamFantasy | null> {
        return this.repository.findOne({where: {id}, relations: {players: true}});
    }

    findByUser(userId: number): Promise<TeamFantasy[]> {
        return this.repository.find({where: {userId}, relations: {league: true}});
    }

    // Teams of the user with their league and its competitions, newest league first
    findByUserWithLeagues(userId: number): Promise<TeamFantasy[]> {
        return this.repository.find({
            where: {userId},
            relations: {league: {competitions: true}},
            order: {createdAt: "DESC"}
        });
    }

    // Ordered by points so it can be used as the league ranking
    findByLeague(leagueId: number): Promise<TeamFantasy[]> {
        return this.repository.find({
            where: {leagueId},
            relations: {user: true},
            order: {totalPoints: "DESC"}
        });
    }

    findByUserAndLeague(userId: number, leagueId: number, manager?: EntityManager): Promise<TeamFantasy | null> {
        return this.repo(manager).findOne({where: {userId, leagueId}});
    }

    countByLeague(leagueId: number, manager?: EntityManager): Promise<number> {
        return this.repo(manager).count({where: {leagueId}});
    }

    async countByLeagues(leagueIds: number[]): Promise<Map<number, number>> {
        if (leagueIds.length === 0) return new Map();
        const teams = await this.repository.find({where: {leagueId: In(leagueIds)}, select: {leagueId: true}});
        const counts = new Map<number, number>();
        for (const team of teams) {
            counts.set(team.leagueId, (counts.get(team.leagueId) ?? 0) + 1);
        }
        return counts;
    }

    create(data: Partial<TeamFantasy>, manager?: EntityManager): Promise<TeamFantasy> {
        const repository = this.repo(manager);
        return repository.save(repository.create(data));
    }

    save(teamFantasy: TeamFantasy): Promise<TeamFantasy> {
        return this.repository.save(teamFantasy);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
