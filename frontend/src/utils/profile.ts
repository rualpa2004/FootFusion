import type { MyLeague } from "../services/league.service";

export interface ProfileStats {
    leaguesCount: number;
    totalPoints: number;
    // Best position of the user's teams and the league where they have it, null without leagues.
    bestRank: {rank: number; leagueName: string} | null;
}

// Start of a new word: after a space, or an upper case letter right after a lower case one ("ApexManager")
const WORD_SEPARATOR = /\s+|(?<=\p{Ll})(?=\p{Lu})/u;

/**
 * Initials of the avatar, from the manager name: the first letter of its first two words, in upper case
 * ("Apex Manager" and "ApexManager" -> "AM", "pepe" -> "P")
 */
export function getInitials(name: string): string {
    const words = name.trim().split(WORD_SEPARATOR).filter(Boolean);
    // Array.from splits by characters, so a name starting with an emoji keeps it whole
    return words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase();
}

export function computeProfileStats(leagues: MyLeague[]): ProfileStats {
    let bestRank: ProfileStats['bestRank'] = null;
    for (const league of leagues) {
        // With the same position, the first league of the list (the newest) is kept
        if (bestRank === null || league.team.rank < bestRank.rank) {
            bestRank = {rank: league.team.rank, leagueName: league.name};
        }
    }

    return {
        leaguesCount: leagues.length,
        totalPoints: leagues.reduce((total, league) => total + league.team.totalPoints, 0),
        bestRank
    };
}
