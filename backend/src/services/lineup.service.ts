import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { LineupRepository } from "../repositories/lineup.repository";
import { PlayerPropertyRepository } from "../repositories/player-property.repository";
import { SportsDataRepository } from "../repositories/sports-data.repository";
import { LeagueCompetitionRepository } from "../repositories/league-competition.repository";
import { League } from "../entities/league.entity";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { PositionGroup } from "../config/league.constants";
import { LeagueAccessService } from "./league-access.service";
import { MatchdayCalendarService } from "./matchday-calendar.service";
import { findNext, Matchday } from "./matchday-rules";
import { lineupError } from "./lineup-rules";
import { LineupMapper } from "../mappers/lineup.mapper";
import { LineupDTO } from "../dtos/team/lineup-response.dto";
import { SaveLineupDTO } from "../dtos/team/save-lineup.dto";

// Matchdays a league can show: from its first one to the next one to be played (or the last one when the season ended)
export function availableMatchdays(calendar: Matchday[], firstMatchday: number, next: Matchday | null): Matchday[] {
    const last = next?.number ?? calendar.at(-1)?.number ?? 0;
    return calendar.filter((matchday) => matchday.number >= firstMatchday && matchday.number <= last);
}

@Injectable()
export class LineupService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly leagueAccessService: LeagueAccessService,
        private readonly lineupRepository: LineupRepository,
        private readonly playerPropertyRepository: PlayerPropertyRepository,
        private readonly sportsDataRepository: SportsDataRepository,
        private readonly leagueCompetitionRepository: LeagueCompetitionRepository,
        private readonly matchdayCalendarService: MatchdayCalendarService
    ) {}

    // Lineup of a team of the league on a matchday (by default the next one). Any member can see it, also the one
    // being prepared; only the owner can edit it, and only before the matchday starts.
    async getLineup(firebaseUid: string, leagueId: number, teamId: number, matchdayNumber?: number): Promise<LineupDTO> {
        const membership = await this.leagueAccessService.findMembership(firebaseUid, leagueId);
        const team = this.leagueAccessService.findTeam(membership, teamId);
        const {now, next, matchdays} = await this.matchdaysOf(membership.league);
        if (matchdays.length === 0) {
            throw new NotFoundException("The league has no matchdays");
        }

        const matchday = matchdayNumber === undefined
            ? next ?? matchdays.at(-1)!
            : matchdays.find((item) => item.number === matchdayNumber);
        if (!matchday) {
            throw new BadRequestException("Matchday not available in this league");
        }

        const upcoming = matchday.number === next?.number;
        // Before the matchday starts, the starters sold since the lineup was saved are not shown
        const ownedIds = upcoming ? new Set((await this.squadPositions(team)).keys()) : undefined;
        return LineupMapper.toDTO({
            teamId: team.id,
            matchday,
            lineup: await this.lineupRepository.findEffective(team.id, matchday.number),
            captainEnabled: membership.league.captainEnabled,
            editable: upcoming && team.id === membership.myTeam.id,
            matchdays,
            now,
            ownedIds
        });
    }

    // Saves the user's lineup for the next matchday. If that matchday started while the user was editing, it is saved
    // for the following one and the response says which matchday it was saved for.
    async saveLineup(firebaseUid: string, leagueId: number, dto: SaveLineupDTO): Promise<LineupDTO> {
        const {league, myTeam} = await this.leagueAccessService.findMembership(firebaseUid, leagueId);
        const {now, next, matchdays} = await this.matchdaysOf(league);
        if (!next) {
            throw new ConflictException("The season has ended");
        }

        const data = {formation: dto.formation, captainId: dto.captainId ?? null, players: dto.players};
        const positions = await this.squadPositions(myTeam);
        const error = lineupError(data, positions, league.captainEnabled);
        if (error) {
            throw new BadRequestException(error);
        }

        const lineup = await this.dataSource.transaction((manager) =>
            this.lineupRepository.saveForMatchday(myTeam.id, next.number, data, manager)
        );
        return LineupMapper.toDTO({
            teamId: myTeam.id, matchday: next, lineup, captainEnabled: league.captainEnabled, editable: true, matchdays, now
        });
    }

    private async matchdaysOf(league: League) {
        const competitionIds = league.competitions?.map((competition) => competition.competitionId)
            ?? await this.leagueCompetitionRepository.findCompetitionIds(league.id);
        const calendar = await this.matchdayCalendarService.getCalendar(competitionIds);
        const now = this.matchdayCalendarService.now();
        const next = findNext(calendar, now);
        // Leagues created before firstMatchday existed start at the first matchday
        const matchdays = availableMatchdays(calendar, league.firstMatchday ?? 1, next);
        return {now, next, matchdays};
    }

    // Position of every player of the team's squad, by PlayerProperty id
    private async squadPositions(team: TeamFantasy): Promise<Map<number, PositionGroup>> {
        const players = await this.playerPropertyRepository.findByTeamFantasy(team.id);
        const byExternalId = await this.sportsDataRepository.findPositionGroups(
            players.map((player) => player.externalPlayerId)
        );
        return new Map(players
            .filter((player) => byExternalId.has(player.externalPlayerId))
            .map((player) => [player.id, byExternalId.get(player.externalPlayerId)!]));
    }
}
