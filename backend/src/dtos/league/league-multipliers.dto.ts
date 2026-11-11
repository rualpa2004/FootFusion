import { IsBoolean, IsEnum, IsIn, ValidateIf } from "class-validator";
import { MultiplierTarget } from "../../entities/league.entity";
import { MULTIPLIER_FACTORS, MULTIPLIER_FINAL_MATCHDAYS } from "../../config/league.constants";

export class LeagueMultipliersDTO {

    @IsBoolean()
    enabled: boolean;

    @ValidateIf((dto: LeagueMultipliersDTO) => dto.enabled === true)
    @IsIn(MULTIPLIER_FINAL_MATCHDAYS)
    finalMatchdays?: number;

    @ValidateIf((dto: LeagueMultipliersDTO) => dto.enabled === true)
    @IsIn(MULTIPLIER_FACTORS)
    factor?: number;

    @ValidateIf((dto: LeagueMultipliersDTO) => dto.enabled === true)
    @IsEnum(MultiplierTarget)
    target?: MultiplierTarget;
}
