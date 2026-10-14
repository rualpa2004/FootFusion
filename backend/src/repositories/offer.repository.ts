import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Offer, OfferStatus} from "../entities/offer.entity";

@Injectable()
export class OfferRepository {

    constructor(
        @InjectRepository(Offer)
        private readonly repository: Repository<Offer>
    ) {}

    findAll(): Promise<Offer[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<Offer | null> {
        return this.repository.findOne({where: {id}});
    }

    findByMarket(marketId: number): Promise<Offer[]> {
        return this.repository.find({
            where: {marketId},
            relations: {user: true},
            order: {amount: "DESC"}
        });
    }

    findByUser(userId: number): Promise<Offer[]> {
        return this.repository.find({
            where: {userId},
            relations: {playerProperty: true, market: true},
            order: {createdAt: "DESC"}
        });
    }

    findPendingByMarket(marketId: number): Promise<Offer[]> {
        return this.repository.find({
            where: {marketId, status: OfferStatus.PENDING},
            relations: {user: true},
            order: {amount: "DESC"}
        });
    }

    findPendingByPlayerProperty(playerPropertyId: number): Promise<Offer[]> {
        return this.repository.find({
            where: {playerPropertyId, status: OfferStatus.PENDING},
            relations: {user: true},
            order: {amount: "DESC"}
        });
    }

    create(data: Partial<Offer>): Promise<Offer> {
        const offer = this.repository.create(data);
        return this.repository.save(offer);
    }

    save(offer: Offer): Promise<Offer> {
        return this.repository.save(offer);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
