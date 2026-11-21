import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {EntityManager, LessThanOrEqual, Repository} from "typeorm";
import {Lineup} from "../entities/lineup.entity";
import {LineupPlayer} from "../entities/lineup-player.entity";

// Starters and settings of a lineup to be saved
export interface LineupData {
    formation: string;
    captainId: number | null;
    players: {slot: string; playerPropertyId: number}[];
}

@Injectable()
export class LineupRepository {

    constructor(
        @InjectRepository(Lineup)
        private readonly repository: Repository<Lineup>
    ) {}

    // Inside a transaction the queries must use its entity manager
    private repo(manager?: EntityManager): Repository<Lineup> {
        return manager ? manager.getRepository(Lineup) : this.repository;
    }

    findEffective(teamFantasyId: number, matchday: number): Promise<Lineup | null> {
        return this.repository.findOne({
            where: {teamFantasyId, matchday: LessThanOrEqual(matchday)},
            relations: {players: true},
            order: {matchday: "DESC"}
        });
    }

    // Creates or replaces the lineup of a matchday with its starters
    async saveForMatchday(teamFantasyId: number, matchday: number, data: LineupData, manager: EntityManager): Promise<Lineup> {
        const repository = this.repo(manager);
        const existing = await repository.findOne({where: {teamFantasyId, matchday}});
        const lineup = await repository.save(repository.create({
            ...existing, teamFantasyId, matchday, formation: data.formation, captainId: data.captainId
        }));

        const players = manager.getRepository(LineupPlayer);
        await players.delete({lineupId: lineup.id});
        if (data.players.length > 0) {
            await players.insert(data.players.map((player) => ({lineupId: lineup.id, ...player})));
        }
        lineup.players = data.players.map((player) => ({lineupId: lineup.id, ...player}) as LineupPlayer);
        return lineup;
    }
}
