import { Module } from "@nestjs/common";
import { SportsDataModule } from "./sports-data.module";
import { SimulatedClockService } from "../services/simulated-clock.service";
import { MatchdayCalendarService } from "../services/matchday-calendar.service";

// Simulated clock and matchday calendar, shared by the leagues and the lineups
@Module({
    imports: [SportsDataModule],
    providers: [SimulatedClockService, MatchdayCalendarService],
    exports: [SimulatedClockService, MatchdayCalendarService]
})
export class MatchdayModule {}
