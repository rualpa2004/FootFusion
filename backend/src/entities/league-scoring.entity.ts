import {Entity, PrimaryColumn, Column, OneToOne, JoinColumn} from 'typeorm';
import {League} from './league.entity';

@Entity("league_scorings")
export class LeagueScoring {

    @PrimaryColumn()
    leagueId!: number;

    @OneToOne(() => League, (league) => league.scoring, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'leagueId'})
    league!: League;

    @Column('int')
    minutesMaxPoints!: number;

    @Column('int')
    forwardGoalPoints!: number;

    @Column('int')
    assistPoints!: number;

    @Column('int')
    defenderCleanSheetPoints!: number;

    @Column('int')
    goalsConcededPenalty!: number;

    @Column('int')
    yellowCardPenalty!: number;

    @Column('int')
    redCardPenalty!: number;

    @Column('int')
    missedPenaltyPenalty!: number;

    @Column('int')
    ownGoalPenalty!: number;

    @Column('int')
    duelsWonPoints!: number;

    @Column('int')
    foulsCommittedPenalty!: number;
}
