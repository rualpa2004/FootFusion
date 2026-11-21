import { Module } from "@nestjs/common";
import { TeamController } from "../controllers/team.controller";
import { TeamService } from "../services/team.service";
import { LineupService } from "../services/lineup.service";
import { LeagueAccessService } from "../services/league-access.service";
import { LeagueModule } from "./league.module";
import { UserModule } from "./user.module";
import { TeamFantasyModule } from "./team-fantasy.module";
import { PlayerPropertyModule } from "./player-property.module";
import { SportsDataModule } from "./sports-data.module";
import { MatchdayModule } from "./matchday.module";
import { LineupModule } from "./lineup.module";

// Squads and lineups of the teams of a league (HU13, HU14, HU15)
@Module({
    imports: [
        LeagueModule,
        UserModule,
        TeamFantasyModule,
        PlayerPropertyModule,
        SportsDataModule,
        MatchdayModule,
        LineupModule
    ],
    controllers: [TeamController],
    providers: [TeamService, LineupService, LeagueAccessService]
})
export class TeamModule {}
