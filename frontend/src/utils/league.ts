import type { ScoringSetting } from "../config/league.constants";
import type { LeagueMember } from "../services/league.service";
import { formatSignedPoints } from "./format";

export const PODIUM_SIZE = 3;

export interface Standing {
    position: number;
    member: LeagueMember;
    points: number;
    isCurrentUser: boolean;
}

/** Ranking of the members (the backend returns them ordered by points) with the user's own row marked. */
export function buildStandings(members: LeagueMember[], currentUserId: number): Standing[] {
    return members.map((member, index) => ({
        position: index + 1,
        member,
        points: member.totalPoints,
        isCurrentUser: member.userId === currentUserId
    }));
}

export function shouldShowPodium(standings: Standing[]): boolean {      //Not showed with less than 3 members or anyone hasn't scored
    return standings.length >= PODIUM_SIZE && standings.some((standing) => standing.points !== 0);
}

export function formatScoringValue(setting: ScoringSetting, value: number): string {
    return setting === 'minutesMaxPoints' ? `hasta ${value}` : formatSignedPoints(value);
}

/** Invitation link of a league: opening it shows the join dialog with the code already typed. */
export function buildInviteLink(joinCode: string, origin: string = window.location.origin): string {
    return `${origin}/leagues/join/${joinCode}`;
}
