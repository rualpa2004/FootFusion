import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { League } from "../entities/league.entity";
import { LeagueRepository } from "../repositories/league.repository";

@Module({
    imports: [TypeOrmModule.forFeature([League])],
    providers: [LeagueRepository],
    exports: [LeagueRepository]
})
export class LeagueModule {}