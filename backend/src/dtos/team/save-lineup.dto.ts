import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Min, ValidateNested } from "class-validator";
import { FORMATION_NAMES, LINEUP_SIZE } from "../../config/league.constants";

// A starter: the formation slot ('GK1', 'DEF1'... 'FWD4') and the PlayerProperty placed in it
export class LineupSlotDTO {

    @IsString()
    @Matches(/^(GK|DEF|MID|FWD)[1-5]$/)
    slot: string;

    @IsInt()
    @Min(1)
    playerPropertyId: number;
}

// Lineup the user saves for the next matchday. Fewer than 11 starters is allowed (the empty slots stay empty).
export class SaveLineupDTO {

    // One of FORMATION_NAMES ('4-4-2'...)
    @IsIn(FORMATION_NAMES)
    formation: string;

    @IsArray()
    @ArrayMaxSize(LINEUP_SIZE)
    @ValidateNested({each: true})
    @Type(() => LineupSlotDTO)
    players: LineupSlotDTO[];

    // Null or missing: no captain this matchday
    @IsOptional()
    @IsInt()
    @Min(1)
    captainId?: number | null;
}
