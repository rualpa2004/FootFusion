import { Lineup } from "../entities/lineup.entity";
import { LineupDTO, MatchdayDTO } from "../dtos/team/lineup-response.dto";
import { Matchday, statusOf } from "../services/matchday-rules";
import { DEFAULT_FORMATION } from "../config/league.constants";

export interface LineupView {
    teamId: number;
    matchday: Matchday;
    lineup: Lineup | null;
    captainEnabled: boolean;
    editable: boolean;
    matchdays: Matchday[];
    now: Date;
    ownedIds?: Set<number>;
}

export class LineupMapper {

    static toMatchdayDTO(matchday: Matchday, now: Date): MatchdayDTO {
        return new MatchdayDTO(matchday, statusOf(matchday, now));
    }

    static toDTO(view: LineupView): LineupDTO {
        const {lineup, matchday, ownedIds} = view;
        const players = (lineup?.players ?? [])
            .filter((player) => !ownedIds || ownedIds.has(player.playerPropertyId))
            .map((player) => ({slot: player.slot, playerPropertyId: player.playerPropertyId}));
        const captainId = lineup?.matchday === matchday.number ? lineup.captainId ?? null : null;
        const captainIsStarter = players.some((player) => player.playerPropertyId === captainId);

        return {
            teamId: view.teamId,
            matchday: LineupMapper.toMatchdayDTO(matchday, view.now),
            formation: lineup?.formation ?? DEFAULT_FORMATION,
            players,
            captainId: captainIsStarter ? captainId : null,
            captainEnabled: view.captainEnabled,
            editable: view.editable,
            matchdays: view.matchdays.map((item) => LineupMapper.toMatchdayDTO(item, view.now))
        };
    }
}
