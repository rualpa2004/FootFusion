import { SquadPlayerDTO } from "../league/league-response.dto";
import { PlayerProperty } from "../../entities/player-property.entity";
import { TeamFantasy } from "../../entities/team-fantasy.entity";
import { PlayerCardData } from "../../repositories/sports-data.repository";
import { PositionGroup, SQUAD_MAX_PLAYERS } from "../../config/league.constants";

// Player of a squad, with the date he joined the team (needed for the protection after a signing)
export class TeamPlayerDTO extends SquadPlayerDTO {
    acquiredAt: Date | null;

    constructor(player: PlayerProperty, card?: PlayerCardData, position?: PositionGroup) {
        super(player, card, position);
        this.acquiredAt = player.acquiredAt ?? null;
    }
}

// A team of the league with its whole squad. The budget is only sent to its owner.
export class TeamDetailDTO {
    id: number;
    name: string;
    userId: number;
    userName: string;
    isMine: boolean;
    rank: number;
    totalPoints: number;
    budget: number | null;
    playersCount: number;
    maxPlayers: number;
    squad: TeamPlayerDTO[];

    // team: loaded with its user. rank: position in the league ranking (1 = first)
    constructor(team: TeamFantasy, rank: number, isMine: boolean, squad: TeamPlayerDTO[]) {
        this.id = team.id;
        this.name = team.name;
        this.userId = team.userId;
        this.userName = team.user?.name;
        this.isMine = isMine;
        this.rank = rank;
        this.totalPoints = team.totalPoints;
        this.budget = isMine ? team.budget : null;
        this.playersCount = squad.length;
        this.maxPlayers = SQUAD_MAX_PLAYERS;
        this.squad = squad;
    }
}
