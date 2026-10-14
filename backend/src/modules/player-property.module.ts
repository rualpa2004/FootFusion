import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerProperty } from "../entities/player-property.entity";
import { PlayerPropertyRepository } from "../repositories/player-property.repository";

@Module({
    imports: [TypeOrmModule.forFeature([PlayerProperty])],
    providers: [PlayerPropertyRepository],
    exports: [PlayerPropertyRepository]
})
export class PlayerPropertyModule {}