import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
    SportsCompetition, SportsCompetitionSchema, SportsMatch, SportsMatchSchema, SportsPlayer, SportsPlayerSchema, SportsTeam,
    SportsTeamSchema
} from "../schemas/sports-data.schemas";
import { SportsDataRepository } from "../repositories/sports-data.repository";
import { CompetitionService } from "../services/competition.service";
import { CompetitionController } from "../controllers/competition.controller";

@Module({
    imports: [MongooseModule.forFeature([
        {name: SportsCompetition.name, schema: SportsCompetitionSchema},
        {name: SportsTeam.name, schema: SportsTeamSchema},
        {name: SportsPlayer.name, schema: SportsPlayerSchema},
        {name: SportsMatch.name, schema: SportsMatchSchema}
    ])],
    controllers: [CompetitionController],
    providers: [SportsDataRepository, CompetitionService],
    exports: [SportsDataRepository]
})
export class SportsDataModule {}
