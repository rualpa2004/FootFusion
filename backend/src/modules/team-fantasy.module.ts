import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { TeamFantasyRepository } from "../repositories/team-fantasy.repository";

@Module({
    imports: [TypeOrmModule.forFeature([TeamFantasy])],
    providers: [TeamFantasyRepository],
    exports: [TeamFantasyRepository]
})
export class TeamFantasyModule {}