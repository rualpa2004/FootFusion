import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique} from 'typeorm';
import {TeamFantasy} from './team-fantasy.entity';
import {PlayerProperty} from './player-property.entity';
import {LineupPlayer} from './lineup-player.entity';

// Lineup a team saved for a matchday. The lineup of matchday N is the last one saved with matchday <= N, so a lineup
// stays until the user changes it; the captain only counts on the matchday it was chosen for. Once a matchday starts
// its row can not change anymore, so it is the lineup used to score it.
@Entity("lineups")
@Unique(['teamFantasyId', 'matchday'])
export class Lineup {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => TeamFantasy, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'teamFantasyId'})
    teamFantasy!: TeamFantasy;

    @Column()
    teamFantasyId!: number;

    @Column('int')
    matchday!: number;

    @Column({length: 5})
    formation!: string;

    @ManyToOne(() => PlayerProperty, {nullable: true, onDelete: 'SET NULL'})
    @JoinColumn({name: 'captainId'})
    captain?: PlayerProperty | null;

    @Column({type: 'int', nullable: true})
    captainId?: number | null;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Only the starters are stored: the bench is the rest of the squad
    @OneToMany(() => LineupPlayer, (player) => player.lineup)
    players!: LineupPlayer[];
}
