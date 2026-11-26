export const PASSWORD_MIN_LENGTH = 8;

// Same checks as Firebase: only the ASCII letters and digits count and only these characters are "special" (other symbols and spaces do not count).
const SPECIAL_CHARACTERS = String.raw`^$*.[]{}()?"!@#%&/\,><':;|_~`;

export interface PasswordRequirement {
    id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
    label: string;
    isMet: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    {id: 'length', label: `${PASSWORD_MIN_LENGTH} o más caracteres`, isMet: (password) => password.length >= PASSWORD_MIN_LENGTH},
    {id: 'uppercase', label: 'Una mayúscula', isMet: (password) => /[A-Z]/.test(password)},
    {id: 'lowercase', label: 'Una minúscula', isMet: (password) => /[a-z]/.test(password)},
    {id: 'number', label: 'Un número', isMet: (password) => /\d/.test(password)},
    {
        id: 'special',
        label: 'Un carácter especial (por ejemplo ! ? # @ $ %)',
        isMet: (password) => [...password].some((character) => SPECIAL_CHARACTERS.includes(character))
    }
];

export function meetsPasswordPolicy(password: string): boolean {
    return PASSWORD_REQUIREMENTS.every((requirement) => requirement.isMet(password));
}
