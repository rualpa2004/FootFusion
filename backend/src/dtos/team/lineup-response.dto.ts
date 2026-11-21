import { Matchday, MatchdayStatus } from "../../services/matchday-rules";

export class MatchdayDTO {
    number: number;
    locksAt: Date;
    endsAt: Date;
    status: MatchdayStatus;

    constructor(matchday: Matchday, status: MatchdayStatus) {
        this.number = matchday.number;
        this.locksAt = matchday.locksAt;
        this.endsAt = matchday.endsAt;
        this.status = status;
    }
}

export class LineupStarterDTO {
    slot: string;
    playerPropertyId: number;
}

// Lineup of a team on a matchday. editable: it is the user's own team and the matchday has not started.
// matchdays: the matchdays of the league that can be consulted (from its first one to the next one).
export class LineupDTO {
    teamId: number;
    matchday: MatchdayDTO;
    formation: string;
    players: LineupStarterDTO[];
    captainId: number | null;
    captainEnabled: boolean;
    editable: boolean;
    matchdays: MatchdayDTO[];
}
