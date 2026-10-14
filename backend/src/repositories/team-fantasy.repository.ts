import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {TeamFantasy} from "../entities/team-fantasy.entity";

@Injectable()
export class TeamFantasyRepository {

    constructor(
        @InjectRepository(TeamFantasy)
        private readonly repository: Repository<TeamFantasy>
    ) {}

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

    // Ordered by points so it can be used as the league ranking
    findByLeague(leagueId: number): Promise<TeamFantasy[]> {
        return this.repository.find({
            where: {leagueId},
            relations: {user: true},
            order: {totalPoints: "DESC"}
        });
    }

    findByUserAndLeague(userId: number, leagueId: number): Promise<TeamFantasy | null> {
        return this.repository.findOne({where: {userId, leagueId}});
    }

    countByLeague(leagueId: number): Promise<number> {
        return this.repository.count({where: {leagueId}});
    }

    create(data: Partial<TeamFantasy>): Promise<TeamFantasy> {
        const teamFantasy = this.repository.create(data);
        return this.repository.save(teamFantasy);
    }

    save(teamFantasy: TeamFantasy): Promise<TeamFantasy> {
        return this.repository.save(teamFantasy);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
