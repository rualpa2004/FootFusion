import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { type AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { LeagueService } from "../services/league.service";
import { CreateLeagueDTO } from "../dtos/league/create-league.dto";
import { JoinLeagueDTO } from "../dtos/league/join-league.dto";
import { RenameLeagueDTO } from "../dtos/league/rename-league.dto";
import { JoinedLeagueResponseDTO, LeagueDetailDTO, LeagueSummaryDTO } from "../dtos/league/league-response.dto";

@ApiTags('leagues')
@ApiBearerAuth()
@Controller('leagues')
@UseGuards(FirebaseAuthGuard)
export class LeagueController {
    constructor(private readonly leagueService: LeagueService) {}

    @Post()
    create(@Body() dto: CreateLeagueDTO, @Req() req: AuthenticatedRequest): Promise<JoinedLeagueResponseDTO> {
        return this.leagueService.create(req.firebaseUid!, dto);
    }

    // Declared before ':id' routes so "join" is never read as an id
    @Post('join')
    join(@Body() dto: JoinLeagueDTO, @Req() req: AuthenticatedRequest): Promise<JoinedLeagueResponseDTO> {
        return this.leagueService.join(req.firebaseUid!, dto);
    }

    @Get()
    findMine(@Req() req: AuthenticatedRequest): Promise<LeagueSummaryDTO[]> {
        return this.leagueService.findMine(req.firebaseUid!);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest): Promise<LeagueDetailDTO> {
        return this.leagueService.findOne(req.firebaseUid!, id);
    }

    @Patch(':id/name')
    rename(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RenameLeagueDTO,
        @Req() req: AuthenticatedRequest
    ): Promise<LeagueDetailDTO> {
        return this.leagueService.rename(req.firebaseUid!, id, dto);
    }
}
