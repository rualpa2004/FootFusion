import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Market } from "../entities/market.entity";
import { MarketRepository } from "../repositories/market.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Market])],
    providers: [MarketRepository],
    exports: [MarketRepository]
})
export class MarketModule {}