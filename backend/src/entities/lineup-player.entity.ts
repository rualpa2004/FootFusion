import {Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Unique} from 'typeorm';
import {Lineup} from './lineup.entity';
import {PlayerProperty} from './player-property.entity';

// Starter of a lineup in one slot of the formation ('GK1', 'DEF1'... 'FWD3')
@Entity("lineup_players")
@Unique(['lineupId', 'playerPropertyId'])
export class LineupPlayer {

    @PrimaryColumn()
    lineupId!: number;

    @PrimaryColumn({length: 5})
    slot!: string;

    @ManyToOne(() => Lineup, (lineup) => lineup.players, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'lineupId'})
    lineup!: Lineup;

    @ManyToOne(() => PlayerProperty, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'playerPropertyId'})
    playerProperty!: PlayerProperty;

    @Column()
    playerPropertyId!: number;
}
