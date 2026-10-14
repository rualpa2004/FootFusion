import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique} from 'typeorm';
import {User} from './user.entity';
import {League} from './league.entity';
import {PlayerProperty} from './player-property.entity';

@Entity("teams_fantasy")
@Unique(['user', 'league'])
export class TeamFantasy {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => User, (user) => user.teamsFantasy, {nullable: false})
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne(() => League, (league) => league.teamsFantasy, {nullable: false})
    @JoinColumn({name: 'leagueId'})
    league!: League;

    @Column()
    leagueId!: number;

    @Column('int')
    budget!: number;

    @Column({default: 0})
    totalPoints!: number;

    @CreateDateColumn()
    createdAt!: Date;

    // Roster of the team. Enforced at the service layer: max 25 players per team
    @OneToMany(() => PlayerProperty, (playerProperty) => playerProperty.teamFantasy)
    players!: PlayerProperty[];
}
