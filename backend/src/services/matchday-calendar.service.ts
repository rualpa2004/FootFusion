import { Injectable } from "@nestjs/common";
import { SportsDataRepository } from "../repositories/sports-data.repository";
import { SimulatedClockService } from "./simulated-clock.service";
import { CALENDAR_CACHE_TTL_MS } from "../config/matchday.constants";
import { buildCalendar, findNext, Matchday } from "./matchday-rules";

@Injectable()
export class MatchdayCalendarService {
    // Calendar of each combination of competitions with the moment it was built
    private readonly cache = new Map<string, {builtAt: number; calendar: Matchday[]}>();

    constructor(
        private readonly sportsDataRepository: SportsDataRepository,
        private readonly clock: SimulatedClockService
    ) {}

    now(): Date {
        return this.clock.now();
    }

    async getCalendar(competitionIds: number[]): Promise<Matchday[]> {
        const key = [...new Set(competitionIds)].sort((a, b) => a - b).join(',');
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.builtAt < CALENDAR_CACHE_TTL_MS) {
            return cached.calendar;
        }

        const calendar = buildCalendar(await this.sportsDataRepository.findMatchDates(competitionIds));
        // An empty calendar is not kept, so it is read again once the ETL loads the fixtures
        if (calendar.length > 0) {
            this.cache.set(key, {builtAt: Date.now(), calendar});
        }
        return calendar;
    }

    async getNext(competitionIds: number[]): Promise<Matchday | null> {
        return findNext(await this.getCalendar(competitionIds), this.now());
    }
}
