import { InternalServerErrorException } from "@nestjs/common";
import { JoinCodeService } from "../../../src/services/join-code.service";
import { JOIN_CODE_ALPHABET, JOIN_CODE_MAX_ATTEMPTS } from "../../../src/config/league.constants";

describe('JoinCodeService', () => {
    const service = new JoinCodeService();

    it('generates 6-character codes without ambiguous characters', () => {
        // Expected: every code has 6 characters of the alphabet, which has no 0, O, 1, I nor L.
        for (let i = 0; i < 200; i++) {
            const code = service.generate();
            expect(code).toHaveLength(6);
            expect([...code].every((character) => JOIN_CODE_ALPHABET.includes(character))).toBe(true);
        }
        expect(JOIN_CODE_ALPHABET).toHaveLength(31);
        expect(JOIN_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
    });

    it('tries again while the generated code is already used', async () => {
        // Expected: the first two codes are used, so the third one is returned after 3 checks.
        const isUsed = jest.fn()
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);

        const code = await service.generateUnique(isUsed);

        expect(isUsed).toHaveBeenCalledTimes(3);
        expect(isUsed).toHaveBeenLastCalledWith(code);
    });

    it('fails after the maximum of attempts', async () => {
        // Expected: InternalServerErrorException after 10 used codes.
        const isUsed = jest.fn().mockResolvedValue(true);

        await expect(service.generateUnique(isUsed)).rejects.toThrow(InternalServerErrorException);
        expect(isUsed).toHaveBeenCalledTimes(JOIN_CODE_MAX_ATTEMPTS);
    });
});
