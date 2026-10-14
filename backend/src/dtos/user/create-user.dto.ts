import { IsString, IsNotEmpty } from "class-validator";

export class CreateUserDTO {

    @IsString()
    @IsNotEmpty()
    name: string;
}