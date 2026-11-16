import {
    BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { League } from "../entities/league.entity";
import { User } from "../entities/user.entity";
import { PlayerProperty } from "../entities/player-property.entity";
import { LeagueRepository } from "../repositories/league.repository";
import { LeagueCompetitionRepository } from "../repositories/league-competition.repository";
import { LeagueScoringRepository } from "../repositories/league-scoring.repository";
import { LeagueBanRepository } from "../repositories/league-ban.repository";
import { TeamFantasyRepository } from "../repositories/team-fantasy.repository";
import { PlayerPropertyRepository } from "../repositories/player-property.repository";
import { UserRepository } from "../repositories/user.repository";
import { BanRepository } from "../repositories/ban.repository";
import { CompetitionData, SportsDataRepository } from "../repositories/sports-data.repository";
import { JoinCodeService } from "./join-code.service";
import { initialClause, SquadAssignmentService, SquadCandidate } from "./squad-assignment.service";
import { CreateLeagueDTO } from "../dtos/league/create-league.dto";
import { JoinLeagueDTO } from "../dtos/league/join-league.dto";
import { RenameLeagueDTO } from "../dtos/league/rename-league.dto";
import { JoinedLeagueResponseDTO, LeagueDetailDTO, LeagueSummaryDTO } from "../dtos/league/league-response.dto";
import { LEAGUE_MAX_TEAMS, PositionGroup } from "../config/league.constants";
import { TeamFantasy } from "../entities/team-fantasy.entity";
import { LeagueMapper } from "../mappers/league.mapper";
import { LeagueScoringMapper } from "../mappers/league-scoring.mapper";
import { LeagueCompetitionMapper } from "../mappers/league-competition.mapper";
import { TeamFantasyMapper } from "../mappers/team-fantasy.mapper";
import { PlayerPropertyMapper } from "../mappers/player-property.mapper";

// Team and squad given to a new member, before reading the card data from MongoDB
interface NewMember {
    league: League;
    team: TeamFantasy;
    squad: PlayerProperty[];
    positions: Map<number, PositionGroup>;
}

@Injectable()
export class LeagueService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly leagueRepository: LeagueRepository,
        private readonly leagueCompetitionRepository: LeagueCompetitionRepository,
        private readonly leagueScoringRepository: LeagueScoringRepository,
        private readonly leagueBanRepository: LeagueBanRepository,
        private readonly teamFantasyRepository: TeamFantasyRepository,
        private readonly playerPropertyRepository: PlayerPropertyRepository,
        private readonly userRepository: UserRepository,
        private readonly banRepository: BanRepository,
        private readonly sportsDataRepository: SportsDataRepository,
        private readonly joinCodeService: JoinCodeService,
        private readonly squadAssignmentService: SquadAssignmentService
    ) {}

    // Creates the league with its settings, all the eligible players as free agents and the creator's team with its initial squad.
    async create(firebaseUid: string, dto: CreateLeagueDTO): Promise<JoinedLeagueResponseDTO> {
        const user = await this.findActiveUser(firebaseUid);
        const competitionIds = [...new Set(dto.competitionIds)];

        const competitions = await this.sportsDataRepository.findCompetitionsByIds(competitionIds);
        if (competitions.length !== competitionIds.length) {
            throw new BadRequestException("Unknown competition");
        }
        const eligiblePlayers = await this.sportsDataRepository.findEligiblePlayers(competitionIds);
        const positions = new Map(eligiblePlayers.map((player) => [player.externalPlayerId, player.positionGroup]));

        const member = await this.dataSource.transaction(async (manager) => {
            const joinCode = await this.joinCodeService.generateUnique(
                (code) => this.leagueRepository.existsByJoinCode(code, manager)
            );
            const league = await this.leagueRepository.create(LeagueMapper.toEntity(dto, joinCode, user.id), manager);

            await this.leagueScoringRepository.create(LeagueScoringMapper.toEntity(dto.scoring, league.id), manager);
            await this.leagueCompetitionRepository.createMany(league.id, competitionIds, manager);
            // Every eligible player starts as a free agent
            await this.playerPropertyRepository.insertMany(
                PlayerPropertyMapper.toEntities(eligiblePlayers, league.id), manager
            );

            return this.addMember(manager, league, user, dto.teamName, positions);
        });

        return this.toJoinedResponse(member);
    }

    // Joins the league of the code and receives the initial squad
    async join(firebaseUid: string, dto: JoinLeagueDTO): Promise<JoinedLeagueResponseDTO> {
        const user = await this.findActiveUser(firebaseUid);
        const joinCode = dto.joinCode.trim().toUpperCase();

        const member = await this.dataSource.transaction(async (manager) => {
            // The lock serialises the users joining the same league until the transaction ends
            const league = await this.leagueRepository.findByJoinCodeForUpdate(joinCode, manager);
            if (!league) {
                throw new NotFoundException("League not found");
            }
            if (await this.leagueBanRepository.existsByLeagueAndUser(league.id, user.id, manager)) {
                throw new ForbiddenException("The user was expelled from this league");
            }
            if (await this.teamFantasyRepository.findByUserAndLeague(user.id, league.id, manager)) {
                throw new ConflictException("The user is already a member of this league");
            }
            if (await this.teamFantasyRepository.countByLeague(league.id, manager) >= LEAGUE_MAX_TEAMS) {
                throw new ConflictException("The league is full");
            }

            const freeAgents = await this.playerPropertyRepository.findFreeAgents(league.id, manager);
            const positions = await this.sportsDataRepository.findPositionGroups(
                freeAgents.map((player) => player.externalPlayerId)
            );
            return this.addMember(manager, league, user, dto.teamName, positions, freeAgents);
        });

        return this.toJoinedResponse(member);
    }

    // Leagues of the user
    async findMine(firebaseUid: string): Promise<LeagueSummaryDTO[]> {
        const user = await this.findUser(firebaseUid);
        const teams = await this.teamFantasyRepository.findByUserWithLeagues(user.id);
        const counts = await this.teamFantasyRepository.countByLeagues(teams.map((team) => team.leagueId));
        const competitionsById = await this.competitionsById();

        return LeagueMapper.toSummaryDTOs(teams, counts, competitionsById, user.id);
    }

    // Info of the whole league, only for its members
    async findOne(firebaseUid: string, leagueId: number): Promise<LeagueDetailDTO> {
        const user = await this.findUser(firebaseUid);
        const league = await this.leagueRepository.findByIdWithSettings(leagueId);
        if (!league) {
            throw new NotFoundException("League not found");
        }
        const teams = await this.teamFantasyRepository.findByLeague(league.id);
        if (!teams.some((team) => team.userId === user.id)) {
            throw new ForbiddenException("The user is not a member of this league");
        }

        const competitions = LeagueCompetitionMapper.toDTOs(league.competitions, await this.competitionsById());
        // findByLeague returns the teams ordered by points, so the members are the league ranking
        return new LeagueDetailDTO(league, user.id, LeagueScoringMapper.toDTO(league.scoring), competitions, teams);
    }

    // To rename the league (only capable once and from the owner).
    async rename(firebaseUid: string, leagueId: number, dto: RenameLeagueDTO): Promise<LeagueDetailDTO> {
        const user = await this.findUser(firebaseUid);
        const league = await this.leagueRepository.findById(leagueId);
        if (!league) {
            throw new NotFoundException("League not found");
        }
        if (league.ownerId !== user.id) {
            throw new ForbiddenException("Only the owner can rename the league");
        }
        if (league.renamed) {
            throw new ConflictException("The league has already been renamed");
        }

        league.name = dto.name.trim();
        league.renamed = true;
        await this.leagueRepository.save(league);
        return this.findOne(firebaseUid, leagueId);
    }

    private async findUser(firebaseUid: string): Promise<User> {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    // A user banned from the application can not create leagues nor join them
    private async findActiveUser(firebaseUid: string): Promise<User> {
        const user = await this.findUser(firebaseUid);
        if (await this.banRepository.findActiveByTargetUser(user.id)) {
            throw new ForbiddenException("The user is banned");
        }
        return user;
    }

    // Creates the user's team with the initial budget and draws its squad among the free agents. The drawn players
    // get the initial squad clause and are protected from now.
    private async addMember(
        manager: EntityManager, league: League, user: User, teamName: string | undefined,
        positions: Map<number, PositionGroup>, freeAgents?: PlayerProperty[]
    ): Promise<NewMember> {
        const team = await this.teamFantasyRepository.create(TeamFantasyMapper.toEntity(user, league.id, teamName), manager);

        const agents = freeAgents ?? await this.playerPropertyRepository.findFreeAgents(league.id, manager);
        const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
        const candidates: SquadCandidate[] = agents
            .filter((agent) => positions.has(agent.externalPlayerId))
            .map((agent) => ({
                id: agent.id,
                positionGroup: positions.get(agent.externalPlayerId)!,
                marketValue: agent.marketValue
            }));

        const acquiredAt = new Date();
        const squad = this.squadAssignmentService.draw(candidates).map((candidate) => {
            const player = agentsById.get(candidate.id)!;
            player.teamFantasyId = team.id;
            player.clauseValue = initialClause(player.marketValue);
            player.acquiredAt = acquiredAt;
            return player;
        });
        await this.playerPropertyRepository.saveMany(squad, manager);

        return {league, team, squad, positions};
    }

    // Adds the card data (name, photo, team) from MongoDB once the transaction has ended
    private async toJoinedResponse({league, team, squad, positions}: NewMember): Promise<JoinedLeagueResponseDTO> {
        const cards = await this.sportsDataRepository.findPlayerCards(squad.map((player) => player.externalPlayerId));
        return new JoinedLeagueResponseDTO(league, team, PlayerPropertyMapper.toSquadDTOs(squad, cards, positions));
    }

    private async competitionsById(): Promise<Map<number, CompetitionData>> {
        const competitions = await this.sportsDataRepository.findCompetitions();
        return new Map(competitions.map((competition) => [competition.id, competition]));
    }
}
