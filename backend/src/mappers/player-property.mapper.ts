import { PlayerProperty } from "../entities/player-property.entity";
import { SquadPlayerDTO } from "../dtos/league/league-response.dto";
import { EligiblePlayer, PlayerCardData } from "../repositories/sports-data.repository";
import { PositionGroup } from "../config/league.constants";

export class PlayerPropertyMapper {

    // Every eligible player starts as a free agent. The clause only matters once someone owns him, so it starts equal
    // to his value.
    static toEntity(player: EligiblePlayer, leagueId: number): Partial<PlayerProperty> {
        return {
            leagueId,
            externalPlayerId: player.externalPlayerId,
            marketValue: player.marketValue,
            clauseValue: player.marketValue
        };
    }

    static toEntities(players: EligiblePlayer[], leagueId: number): Partial<PlayerProperty>[] {
        return players.map((player) => PlayerPropertyMapper.toEntity(player, leagueId));
    }

    static toSquadDTO(player: PlayerProperty, card?: PlayerCardData, position?: PositionGroup): SquadPlayerDTO {
        return new SquadPlayerDTO(player, card, position);
    }

    // cards and positions are indexed by the external player id
    static toSquadDTOs(
        squad: PlayerProperty[], cards: Map<number, PlayerCardData>, positions: Map<number, PositionGroup>
    ): SquadPlayerDTO[] {
        return squad.map((player) => PlayerPropertyMapper.toSquadDTO(
            player, cards.get(player.externalPlayerId), positions.get(player.externalPlayerId)
        ));
    }
}
