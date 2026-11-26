import { describe, expect, it } from 'vitest';
import { meetsPasswordPolicy, PASSWORD_REQUIREMENTS } from '../../../src/utils/password';

/** Ids of the requirements the password meets. */
function metRequirements(password: string): string[] {
    return PASSWORD_REQUIREMENTS.filter((requirement) => requirement.isMet(password)).map((requirement) => requirement.id);
}

describe('password policy', () => {
    it('lists the five requirements in the order shown under the field', () => {
        // Expected: length, upper case, lower case, number and special character.
        expect(PASSWORD_REQUIREMENTS.map((requirement) => requirement.id))
            .toEqual(['length', 'uppercase', 'lowercase', 'number', 'special']);
    });

    it('meets nothing with an empty password', () => {
        // Expected: no requirement met and the policy not met.
        expect(metRequirements('')).toEqual([]);
        expect(meetsPasswordPolicy('')).toBe(false);
    });

    it('checks each requirement on its own', () => {
        // Expected: "Secret1" meets upper case, lower case and number, but not the length nor the special character.
        expect(metRequirements('Secret1')).toEqual(['uppercase', 'lowercase', 'number']);
    });

    it('accepts a password that meets every requirement, with exactly 8 characters', () => {
        // Expected: the policy met.
        expect(meetsPasswordPolicy('Secret1!')).toBe(true);
    });

    it.each(['^', '$', '*', '.', '[', ']', '{', '}', '(', ')', '?', '"', '!', '@', '#', '%', '&', '/', '\\', ',', '>', '<', "'", ':', ';', '|', '_', '~'])(
        'counts "%s" as a special character, as Firebase does',
        (character) => {
            // Expected: the special character requirement met.
            expect(metRequirements(character)).toContain('special');
        }
    );

    it.each(['=', '+', '-', '`', ' ', '€'])('does not count "%s" as a special character (Firebase does not)', (character) => {
        // Expected: the special character requirement not met, so Firebase never rejects a password shown as valid.
        expect(metRequirements(character)).not.toContain('special');
    });

    it('only counts the ASCII letters, as Firebase does', () => {
        // Expected: "Ñ" and "á" are neither upper nor lower case letters for the policy.
        expect(metRequirements('Ñá')).toEqual([]);
    });
});
