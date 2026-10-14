import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Offer } from "../entities/offer.entity";
import { OfferRepository } from "../repositories/offer.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Offer])],
    providers: [OfferRepository],
    exports: [OfferRepository]
})
export class OfferModule {}