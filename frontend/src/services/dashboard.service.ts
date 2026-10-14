// TODO: match the API requests needed when the endpoints will be created

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type RankTrend = 'up' | 'down' | 'same';

export interface ManagerSummary {
    globalRank: number;
    currentGameweek: number;
}

export interface GameweekScore {
    gameweek: number;
    points: number;
    averagePoints: number;
}

export interface TransferDeadline {
    gameweek: number;
    deadline: string;
}

export interface LeagueStanding {
    position: number;
    managerName: string;
    points: number;
    isCurrentUser: boolean;
    trend: RankTrend;
}

export interface LeagueSummary {
    id: number;
    name: string;
    standings: LeagueStanding[];
}

export interface TopPerformer {
    id: number;
    name: string;
    position: PlayerPosition;
    team: string;
    priceInMillions: number;
    points: number;
    photoUrl?: string;
}

export interface LineupStatus {
    isReady: boolean;
    flaggedPlayers: number;
}

export interface DashboardData {
    gameweekScore: GameweekScore;
    transferDeadline: TransferDeadline;
    league: LeagueSummary;
    topPerformers: TopPerformer[];
    lineupStatus: LineupStatus;
}

const HOUR_IN_MS = 60 * 60 * 1000;

export async function getManagerSummary(): Promise<ManagerSummary> {
    return {
        globalRank: 2421,
        currentGameweek: 24
    };
}

export async function getDashboardData(): Promise<DashboardData> {
    return {
        gameweekScore: {
            gameweek: 24,
            points: 78,
            averagePoints: 54
        },
        transferDeadline: {
            gameweek: 25,
            deadline: new Date(Date.now() + 38.7 * HOUR_IN_MS).toISOString()
        },
        league: {
            id: 1,
            name: 'Global Friends League',
            standings: [
                {position: 1, managerName: 'UltraStriker', points: 1524, isCurrentUser: false, trend: 'up'},
                {position: 2, managerName: 'ApexManager', points: 1498, isCurrentUser: true, trend: 'same'},
                {position: 3, managerName: 'FifaTactician', points: 1412, isCurrentUser: false, trend: 'down'}
            ]
        },
        topPerformers: [
            {id: 1, name: 'M. Salah', position: 'MID', team: 'LIV', priceInMillions: 12.4, points: 15},
            {id: 2, name: 'E. Haaland', position: 'FWD', team: 'MCI', priceInMillions: 14.2, points: 12},
            {id: 3, name: 'B. Saka', position: 'MID', team: 'ARS', priceInMillions: 8.8, points: 11}
        ],
        lineupStatus: {
            isReady: true,
            flaggedPlayers: 0
        }
    };
}
