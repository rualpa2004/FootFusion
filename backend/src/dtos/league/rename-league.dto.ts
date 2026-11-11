import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";
import { LEAGUE_NAME_MAX_LENGTH, LEAGUE_NAME_MIN_LENGTH } from "../../config/league.constants";
import { trim } from "./create-league.dto";

export class RenameLeagueDTO {

    @Transform(trim)
    @IsString()
    @Length(LEAGUE_NAME_MIN_LENGTH, LEAGUE_NAME_MAX_LENGTH)
    name: string;
}
