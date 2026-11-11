import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { CompetitionService } from "../services/competition.service";
import { CompetitionResponseDTO } from "../dtos/competition/competition-response.dto";

@ApiTags('competitions')
@ApiBearerAuth()
@Controller('competitions')
@UseGuards(FirebaseAuthGuard)
export class CompetitionController {
    
    constructor(private readonly competitionService: CompetitionService) {}

    @Get()
    findAll(): Promise<CompetitionResponseDTO[]> {
        return this.competitionService.findAll();
    }
}
