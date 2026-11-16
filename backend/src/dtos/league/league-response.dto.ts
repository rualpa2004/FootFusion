import { League, MultiplierTarget } from "../../entities/league.entity";
import { ScoringSettings } from "../../config/scoring.constants";
import { LEAGUE_INITIAL_BUDGET, LEAGUE_MAX_TEAMS, PositionGroup } from "../../config/league.constants";
import { CompetitionResponseDTO } from "../competition/competition-response.dto";
import { TeamFantasy } from "../../entities/team-fantasy.entity";
import { PlayerProperty } from "../../entities/player-property.entity";
import { PlayerCardData } from "../../repositories/sports-data.repository";

// Player of the squad received when creating or joining a league (shown as cards in the frontend)
export class SquadPlayerDTO {
    playerPropertyId: number;
    externalPlayerId: number;
    name: string;
    photo?: string;
    positionGroup?: string;
    teamName?: string;
    teamLogo?: string;
    marketValue: number;
    clauseValue: number;

    // card: data of the real player in MongoDB. position: used when the card has no position group
    constructor(player: PlayerProperty, card?: PlayerCardData, position?: PositionGroup) {
        this.playerPropertyId = player.id;
        this.externalPlayerId = player.externalPlayerId;
        this.name = card?.name ?? '';
        this.photo = card?.photo;
        this.positionGroup = card?.positionGroup ?? position;
        this.teamName = card?.teamName;
        this.teamLogo = card?.teamLogo;
        this.marketValue = player.marketValue;
        this.clauseValue = player.clauseValue;
    }
}

export class FantasyTeamDTO {
    id: number;
    name: string;
    budget: number;
    totalPoints: number;

    constructor(team: TeamFantasy) {
        this.id = team.id;
        this.name = team.name;
        this.budget = team.budget;
        this.totalPoints = team.totalPoints ?? 0;
    }
}

// Response of creating or joining a league: the league, the user's new team and its initial squad
export class JoinedLeagueResponseDTO {
    league: {id: number; name: string; joinCode: string};
    team: FantasyTeamDTO;
    squad: SquadPlayerDTO[];

    constructor(league: League, team: TeamFantasy, squad: SquadPlayerDTO[]) {
        this.league = {id: league.id, name: league.name, joinCode: league.joinCode};
        this.team = new FantasyTeamDTO(team);
        this.squad = squad;
    }
}

// A league in the list of the user's leagues
export class LeagueSummaryDTO {
    id: number;
    name: string;
    competitions: CompetitionResponseDTO[];
    membersCount: number;
    maxTeams: number;
    isOwner: boolean;
    team: FantasyTeamDTO;

    // team: the user's team, loaded with its league
    constructor(team: TeamFantasy, membersCount: number, competitions: CompetitionResponseDTO[], userId: number) {
        this.id = team.league.id;
        this.name = team.league.name;
        this.competitions = competitions;
        this.membersCount = membersCount;
        this.maxTeams = LEAGUE_MAX_TEAMS;
        this.isOwner = team.league.ownerId === userId;
        this.team = new FantasyTeamDTO(team);
    }
}

export class LeagueMultipliersResponseDTO {
    enabled: boolean;
    finalMatchdays: number | null;
    factor: number | null;
    target: MultiplierTarget | null;

    constructor(league: League) {
        this.enabled = league.multipliersEnabled;
        this.finalMatchdays = league.multiplierFinalMatchdays ?? null;
        this.factor = league.multiplierFactor ?? null;
        this.target = league.multiplierTarget ?? null;
    }
}

// A team of the league ranking
export class LeagueMemberDTO {
    teamId: number;
    teamName: string;
    userId: number;
    userName: string;
    totalPoints: number;

    // team: loaded with its user
    constructor(team: TeamFantasy) {
        this.teamId = team.id;
        this.teamName = team.name;
        this.userId = team.userId;
        this.userName = team.user?.name;
        this.totalPoints = team.totalPoints;
    }
}

// Whole league, only for its members
export class LeagueDetailDTO {
    id: number;
    name: string;
    joinCode: string;
    ownerId: number;
    isOwner: boolean;
    canRename: boolean;
    createdAt: Date;
    initialBudget: number;
    maxTeams: number;
    pointReward: number;
    captainEnabled: boolean;
    multipliers: LeagueMultipliersResponseDTO;
    scoring: ScoringSettings | null;
    competitions: CompetitionResponseDTO[];
    members: LeagueMemberDTO[];

    // teams: the league ranking (ordered by points), loaded with their users. userId: the user making the request
    constructor(league: League, userId: number, scoring: ScoringSettings | null, competitions: CompetitionResponseDTO[], teams: TeamFantasy[]) {
        this.id = league.id;
        this.name = league.name;
        this.joinCode = league.joinCode;
        this.ownerId = league.ownerId;
        this.isOwner = league.ownerId === userId;
        this.canRename = this.isOwner && !league.renamed;
        this.createdAt = league.createdAt;
        this.initialBudget = LEAGUE_INITIAL_BUDGET;
        this.maxTeams = LEAGUE_MAX_TEAMS;
        this.pointReward = league.pointReward;
        this.captainEnabled = league.captainEnabled;
        this.multipliers = new LeagueMultipliersResponseDTO(league);
        this.scoring = scoring;
        this.competitions = competitions;
        this.members = teams.map((team) => new LeagueMemberDTO(team));
    }
}
