import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany} from 'typeorm';
import {TeamFantasy} from './team-fantasy.entity';
import {PlayerProperty} from './player-property.entity';

@Entity("leagues")
export class League {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({unique: true})
    joinCode!: string;

    @Column('int')
    initialBudget!: number;

    @Column({ default: 10 })
    maxTeams!: number;

    @Column('simple-array', {nullable: true})
    competitionIds?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @OneToMany(() => TeamFantasy, (teamFantasy) => teamFantasy.league)
    teamsFantasy!: TeamFantasy[];

    @OneToMany(() => PlayerProperty, (playerProperty) => playerProperty.league)
    playerProperties!: PlayerProperty[];
}
