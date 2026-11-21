import { SimulatedClockService } from "../../../src/services/simulated-clock.service";

// The service only needs the ConfigService type
jest.mock('@nestjs/config', () => ({ConfigService: class ConfigService {}}));

const config = (value?: string) => ({get: jest.fn().mockReturnValue(value)});

describe('SimulatedClockService', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('goes 365 days behind the real date by default', () => {
        // Expected: on the real 16/11/2026 the simulated date is 16/11/2025.
        jest.useFakeTimers({now: new Date('2026-11-16T12:00:00Z')});
        const clock = new SimulatedClockService(config() as never);

        expect(clock.now()).toEqual(new Date('2025-11-16T12:00:00Z'));
    });

    it('uses the offset of SIMULATED_DATE_OFFSET_DAYS', () => {
        // Expected: with 10 days the simulated date is 06/11/2026.
        jest.useFakeTimers({now: new Date('2026-11-16T12:00:00Z')});
        const clock = new SimulatedClockService(config('10') as never);

        expect(clock.now()).toEqual(new Date('2026-11-06T12:00:00Z'));
    });

    it('ignores an invalid offset', () => {
        // Expected: a non-numeric value falls back to 365 days.
        const clock = new SimulatedClockService(config('one year') as never);

        expect(clock.toSimulated(new Date('2026-01-01T00:00:00Z'))).toEqual(new Date('2025-01-01T00:00:00Z'));
    });
});
