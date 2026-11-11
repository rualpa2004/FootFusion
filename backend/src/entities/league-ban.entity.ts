import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique} from 'typeorm';
import {League} from './league.entity';
import {User} from './user.entity';

// The rows are created when a member is expelled from a League (different from Ban, which blocks the player from the whole application)
@Entity("league_bans")
@Unique(['leagueId', 'userId'])
export class LeagueBan {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => League, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'leagueId'})
    league!: League;

    @Column()
    leagueId!: number;

    @ManyToOne(() => User, {nullable: false})
    @JoinColumn({name: 'userId'})
    user!: User;

    @Column()
    userId!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
