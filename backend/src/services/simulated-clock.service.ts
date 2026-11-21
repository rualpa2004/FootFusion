import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DEFAULT_SIMULATED_DATE_OFFSET_DAYS } from "../config/matchday.constants";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "Now" of the game. The data belongs to a past season, so every game rule (locks, matchdays) uses the real date moved
// back a fixed number of days instead of new Date().
@Injectable()
export class SimulatedClockService {
    private readonly offsetMs: number;

    constructor(configService: ConfigService) {
        // A missing, empty or non-numeric value falls back to the default
        const raw = configService.get<string>('SIMULATED_DATE_OFFSET_DAYS')?.trim();
        const days = raw && Number.isFinite(Number(raw)) ? Number(raw) : DEFAULT_SIMULATED_DATE_OFFSET_DAYS;
        this.offsetMs = days * MS_PER_DAY;
    }

    now(): Date {
        return this.toSimulated(new Date());
    }

    // Simulated date of a real moment (e.g. when a row was created)
    toSimulated(realDate: Date): Date {
        return new Date(realDate.getTime() - this.offsetMs);
    }
}
