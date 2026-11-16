import { Transform, Type } from "class-transformer";
import {
    ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsDefined, IsIn, IsInt, IsOptional, IsString, Length,
    ValidateNested
} from "class-validator";
import {
    LEAGUE_MAX_COMPETITIONS, LEAGUE_MIN_COMPETITIONS, LEAGUE_NAME_MAX_LENGTH, LEAGUE_NAME_MIN_LENGTH, POINT_REWARDS,
    TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH
} from "../../config/league.constants";
import { LeagueScoringDTO } from "./league-scoring.dto";
import { LeagueMultipliersDTO } from "./league-multipliers.dto";

// Removes the spaces at both ends before validating the length
export const trim = ({value}: {value: unknown}) => typeof value === 'string' ? value.trim() : value;

export class CreateLeagueDTO {

    @Transform(trim)
    @IsString()
    @Length(LEAGUE_NAME_MIN_LENGTH, LEAGUE_NAME_MAX_LENGTH)
    name: string;

    // Highlightly ids of the competitions (checked against MongoDB in the service)
    @IsArray()
    @ArrayMinSize(LEAGUE_MIN_COMPETITIONS)
    @ArrayMaxSize(LEAGUE_MAX_COMPETITIONS)
    @ArrayUnique()
    @IsInt({each: true})
    competitionIds: number[];

    @IsDefined()
    @ValidateNested()
    @Type(() => LeagueScoringDTO)
    scoring: LeagueScoringDTO;

    @IsIn(POINT_REWARDS)
    pointReward: number;

    @IsBoolean()
    captainEnabled: boolean;

    @IsDefined()
    @ValidateNested()
    @Type(() => LeagueMultipliersDTO)
    multipliers: LeagueMultipliersDTO;

    // Name of the creator's team; the user's name when it is missing
    @IsOptional()
    @Transform(trim)
    @IsString()
    @Length(TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH)
    teamName?: string;
}
