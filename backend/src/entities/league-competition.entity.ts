import {Entity, PrimaryColumn, ManyToOne, JoinColumn} from 'typeorm';
import {League} from './league.entity';

// Real competitions of a league, one row per (league, competition).
@Entity("league_competitions")
export class LeagueCompetition {

    @PrimaryColumn()
    leagueId!: number;

    // Highlightly id of the competition
    @PrimaryColumn()
    competitionId!: number;

    @ManyToOne(() => League, (league) => league.competitions, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'leagueId'})
    league!: League;
}
