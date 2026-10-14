import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {LessThanOrEqual, Repository} from "typeorm";
import {Market, MarketListingStatus} from "../entities/market.entity";

@Injectable()
export class MarketRepository {

    constructor(
        @InjectRepository(Market)
        private readonly repository: Repository<Market>
    ) {}

    findAll(): Promise<Market[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<Market | null> {
        return this.repository.findOne({where: {id}});
    }

    findActive(leagueId: number): Promise<Market[]> {
        return this.repository.find({
            where: {status: MarketListingStatus.ACTIVE, playerProperty: {leagueId}},
            relations: {playerProperty: true},
            order: {listedAt: "DESC"}
        });
    }

    findActiveByPlayerProperty(playerPropertyId: number): Promise<Market | null> {
        return this.repository.findOne({where: {playerPropertyId, status: MarketListingStatus.ACTIVE}});
    }

    // Listings still ACTIVE whose expiration date has already passed
    findExpired(now: Date = new Date()): Promise<Market[]> {
        return this.repository.find({
            where: {status: MarketListingStatus.ACTIVE, expiresAt: LessThanOrEqual(now)}
        });
    }

    create(data: Partial<Market>): Promise<Market> {
        const market = this.repository.create(data);
        return this.repository.save(market);
    }

    save(market: Market): Promise<Market> {
        return this.repository.save(market);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
