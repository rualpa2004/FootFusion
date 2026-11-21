import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lineup } from "../entities/lineup.entity";
import { LineupPlayer } from "../entities/lineup-player.entity";
import { LineupRepository } from "../repositories/lineup.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Lineup, LineupPlayer])],
    providers: [LineupRepository],
    exports: [LineupRepository]
})
export class LineupModule {}
