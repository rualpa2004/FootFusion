import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {SportsCompetition, SportsPlayer, SportsTeam} from "../schemas/sports-data.schemas";
import {POSITION_GROUPS, PositionGroup} from "../config/league.constants";

export interface CompetitionData {
    id: number;
    name: string;
    logo?: string;
    countryName?: string;
}

export interface EligiblePlayer {
    externalPlayerId: number;
    positionGroup: PositionGroup;
    marketValue: number;
}

export interface PlayerCardData {
    externalPlayerId: number;
    name: string;
    photo?: string;
    positionGroup?: string;
    teamName?: string;
    teamLogo?: string;
}

@Injectable()
export class SportsDataRepository {

    constructor(
        @InjectModel(SportsCompetition.name) private readonly competitionModel: Model<SportsCompetition>,
        @InjectModel(SportsTeam.name) private readonly teamModel: Model<SportsTeam>,
        @InjectModel(SportsPlayer.name) private readonly playerModel: Model<SportsPlayer>
    ) {}

    async findCompetitions(): Promise<CompetitionData[]> {
        const competitions = await this.competitionModel.find().sort({name: 1}).lean();
        return competitions.map((competition) => ({
            id: competition.external_id,
            name: competition.name,
            logo: competition.logo,
            countryName: competition.country_name
        }));
    }

    async findCompetitionsByIds(ids: number[]): Promise<CompetitionData[]> {
        const competitions = await this.competitionModel.find({external_id: {$in: ids}}).lean();
        return competitions.map((competition) => ({
            id: competition.external_id,
            name: competition.name,
            logo: competition.logo,
            countryName: competition.country_name
        }));
    }

    async findEligiblePlayers(competitionIds: number[]): Promise<EligiblePlayer[]> {
        const teams = await this.teamModel.find({competition_ids: {$in: competitionIds}}, {external_id: 1}).lean();
        const players = await this.playerModel.find({
            team_id: {$in: teams.map((team) => team.external_id)},
            position_group: {$in: POSITION_GROUPS},
            market_value: {$ne: null}
        }, {external_id: 1, position_group: 1, market_value: 1}).lean();

        return players.map((player) => ({
            externalPlayerId: player.external_id,
            positionGroup: player.position_group as PositionGroup,
            marketValue: player.market_value!
        }));
    }

    async findPositionGroups(externalPlayerIds: number[]): Promise<Map<number, PositionGroup>> {
        const players = await this.playerModel.find(
            {external_id: {$in: externalPlayerIds}, position_group: {$in: POSITION_GROUPS}},
            {external_id: 1, position_group: 1}
        ).lean();
        return new Map(players.map((player) => [player.external_id, player.position_group as PositionGroup]));
    }

    // Data shown on the player cards (name, photo, position and team)
    async findPlayerCards(externalPlayerIds: number[]): Promise<Map<number, PlayerCardData>> {
        const players = await this.playerModel.find({external_id: {$in: externalPlayerIds}}).lean();
        const teamIds = [...new Set(players.map((player) => player.team_id).filter((id) => id != null))];
        const teams = await this.teamModel.find({external_id: {$in: teamIds}}).lean();
        const teamsById = new Map(teams.map((team) => [team.external_id, team]));

        return new Map(players.map((player) => {
            const team = player.team_id != null ? teamsById.get(player.team_id) : undefined;
            return [player.external_id, {
                externalPlayerId: player.external_id,
                name: player.name,
                photo: player.photo ?? undefined,
                positionGroup: player.position_group ?? undefined,
                teamName: team?.name,
                teamLogo: team?.logo ?? undefined
            }];
        }));
    }
}
