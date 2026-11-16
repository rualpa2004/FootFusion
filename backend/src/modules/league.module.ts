import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { League } from "../entities/league.entity";
import { LeagueCompetition } from "../entities/league-competition.entity";
import { LeagueScoring } from "../entities/league-scoring.entity";
import { LeagueBan } from "../entities/league-ban.entity";
import { LeagueRepository } from "../repositories/league.repository";
import { LeagueCompetitionRepository } from "../repositories/league-competition.repository";
import { LeagueScoringRepository } from "../repositories/league-scoring.repository";
import { LeagueBanRepository } from "../repositories/league-ban.repository";
import { LeagueService } from "../services/league.service";
import { JoinCodeService } from "../services/join-code.service";
import { SquadAssignmentService } from "../services/squad-assignment.service";
import { LeagueController } from "../controllers/league.controller";
import { UserModule } from "./user.module";
import { BanModule } from "./ban.module";
import { TeamFantasyModule } from "./team-fantasy.module";
import { PlayerPropertyModule } from "./player-property.module";
import { SportsDataModule } from "./sports-data.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([League, LeagueCompetition, LeagueScoring, LeagueBan]),
        UserModule,
        BanModule,
        TeamFantasyModule,
        PlayerPropertyModule,
        SportsDataModule
    ],
    controllers: [LeagueController],
    providers: [
        LeagueRepository,
        LeagueCompetitionRepository,
        LeagueScoringRepository,
        LeagueBanRepository,
        LeagueService,
        JoinCodeService,
        SquadAssignmentService
    ],
    exports: [LeagueRepository, LeagueCompetitionRepository, LeagueScoringRepository, LeagueBanRepository]
})
export class LeagueModule {}
