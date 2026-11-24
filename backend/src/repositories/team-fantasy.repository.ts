import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, In, Repository} from "typeorm";
import {TeamFantasy} from "../entities/team-fantasy.entity";

// Order of a league ranking: more points first and, with the same points, the team that joined first
const RANKING_ORDER = {totalPoints: "DESC", id: "ASC"} as const;

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

    // Ordered like the league ranking. With the same points, the team that joined first goes first (lower id)
    findByLeague(leagueId: number): Promise<TeamFantasy[]> {
        return this.repository.find({
            where: {leagueId},
            relations: {user: true},
            order: RANKING_ORDER
        });
    }

    findByUserAndLeague(userId: number, leagueId: number, manager?: EntityManager): Promise<TeamFantasy | null> {
        return this.repo(manager).findOne({where: {userId, leagueId}});
    }

    countByLeague(leagueId: number, manager?: EntityManager): Promise<number> {
        return this.repo(manager).count({where: {leagueId}});
    }

    /**
     * Ranking of several leagues in one query: the team ids of each league in ranking order ({leagueId: [teamIds]}).
     * Gives both the number of members and the position of a team without loading the whole teams.
     */
    async findRankingsByLeagues(leagueIds: number[]): Promise<Map<number, number[]>> {
        if (leagueIds.length === 0) return new Map();
        const teams = await this.repository.find({
            where: {leagueId: In(leagueIds)},
            select: {id: true, leagueId: true},
            order: RANKING_ORDER
        });
        const rankings = new Map<number, number[]>();
        for (const team of teams) {
            rankings.set(team.leagueId, [...(rankings.get(team.leagueId) ?? []), team.id]);
        }
        return rankings;
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
