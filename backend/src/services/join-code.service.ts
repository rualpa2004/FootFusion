import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { randomInt } from "crypto";
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH, JOIN_CODE_MAX_ATTEMPTS } from "../config/league.constants";

@Injectable()
export class JoinCodeService {

    // Random code from a cryptographic source, so the codes of other leagues can not be predicted
    generate(): string {
        let code = '';
        for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
            code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
        }
        return code;
    }

    // Generates codes until one is not used
    async generateUnique(isUsed: (code: string) => Promise<boolean>): Promise<string> {
        for (let attempt = 0; attempt < JOIN_CODE_MAX_ATTEMPTS; attempt++) {
            const code = this.generate();
            if (!(await isUsed(code))) {
                return code;
            }
        }
        throw new InternalServerErrorException("Could not generate a unique join code");
    }
}
