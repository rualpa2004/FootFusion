import { Transform } from "class-transformer";
import { IsOptional, IsString, Length, Matches } from "class-validator";
import { JOIN_CODE_LENGTH, TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH } from "../../config/league.constants";
import { trim } from "./create-league.dto";

export class JoinLeagueDTO {

    // Case-insensitive: the code is stored in capital letters
    @Transform(({value}: {value: unknown}) => typeof value === 'string' ? value.trim().toUpperCase() : value)
    @IsString()
    @Length(JOIN_CODE_LENGTH, JOIN_CODE_LENGTH)
    @Matches(/^[A-Z0-9]+$/)
    joinCode: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @Length(TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH)
    teamName?: string;
}
