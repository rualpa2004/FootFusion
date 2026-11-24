import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";
import { MANAGER_NAME_MAX_LENGTH, MANAGER_NAME_MIN_LENGTH } from "../../config/user.constants";
import { trim } from "../transforms";

export class CreateUserDTO {

    @Transform(trim)
    @IsString()
    @Length(MANAGER_NAME_MIN_LENGTH, MANAGER_NAME_MAX_LENGTH)
    name: string;
}
