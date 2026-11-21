import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, Req, UseGuards } from "@nestjs/common";
import { type AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { TeamService } from "../services/team.service";
import { LineupService } from "../services/lineup.service";
import { TeamDetailDTO } from "../dtos/team/team-response.dto";
import { LineupDTO } from "../dtos/team/lineup-response.dto";
import { SaveLineupDTO } from "../dtos/team/save-lineup.dto";

// Squads and lineups of the teams of a league
@ApiTags('teams')
@ApiBearerAuth()
@Controller('leagues')
@UseGuards(FirebaseAuthGuard)
export class TeamController {
    constructor(
        private readonly teamService: TeamService,
        private readonly lineupService: LineupService
    ) {}

    @Get(':id/teams/:teamId')
    getTeam(
        @Param('id', ParseIntPipe) id: number,
        @Param('teamId', ParseIntPipe) teamId: number,
        @Req() req: AuthenticatedRequest
    ): Promise<TeamDetailDTO> {
        return this.teamService.getTeam(req.firebaseUid!, id, teamId);
    }

    @Get(':id/teams/:teamId/lineup')
    @ApiQuery({name: 'matchday', required: false, description: 'Matchday number (the next one by default)'})
    getLineup(
        @Param('id', ParseIntPipe) id: number,
        @Param('teamId', ParseIntPipe) teamId: number,
        @Query('matchday', new ParseIntPipe({optional: true})) matchday: number | undefined,
        @Req() req: AuthenticatedRequest
    ): Promise<LineupDTO> {
        return this.lineupService.getLineup(req.firebaseUid!, id, teamId, matchday);
    }

    // Replaces the user's lineup of the next matchday
    @Put(':id/lineup')
    saveLineup(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SaveLineupDTO,
        @Req() req: AuthenticatedRequest
    ): Promise<LineupDTO> {
        return this.lineupService.saveLineup(req.firebaseUid!, id, dto);
    }
}
