import { Injectable } from "@nestjs/common";
import { PlayerPropertyRepository } from "../repositories/player-property.repository";
import { SportsDataRepository } from "../repositories/sports-data.repository";
import { LeagueAccessService } from "./league-access.service";
import { TeamDetailDTO, TeamPlayerDTO } from "../dtos/team/team-response.dto";
import { POSITION_GROUPS } from "../config/league.constants";

@Injectable()
export class TeamService {
    constructor(
        private readonly leagueAccessService: LeagueAccessService,
        private readonly playerPropertyRepository: PlayerPropertyRepository,
        private readonly sportsDataRepository: SportsDataRepository
    ) {}

    // Team of the league with its whole squad (value and clause included), ordered by position and value. Any member
    // can see it; the budget is only shown to its owner.
    async getTeam(firebaseUid: string, leagueId: number, teamId: number): Promise<TeamDetailDTO> {
        const membership = await this.leagueAccessService.findMembership(firebaseUid, leagueId);
        const team = this.leagueAccessService.findTeam(membership, teamId);

        const players = await this.playerPropertyRepository.findByTeamFantasy(team.id);
        const externalIds = players.map((player) => player.externalPlayerId);
        const [cards, positions] = await Promise.all([
            this.sportsDataRepository.findPlayerCards(externalIds),
            this.sportsDataRepository.findPositionGroups(externalIds)
        ]);

        const squad = players
            .map((player) => new TeamPlayerDTO(
                player, cards.get(player.externalPlayerId), positions.get(player.externalPlayerId)
            ))
            .sort((a, b) => positionOrder(a.positionGroup) - positionOrder(b.positionGroup) || b.marketValue - a.marketValue);

        // The ranking is ordered by points, so the index is the position
        const rank = membership.teams.indexOf(team) + 1;
        return new TeamDetailDTO(team, rank, team.id === membership.myTeam.id, squad);
    }
}

function positionOrder(positionGroup?: string): number {
    const index = POSITION_GROUPS.indexOf(positionGroup as never);
    return index === -1 ? POSITION_GROUPS.length : index;
}
