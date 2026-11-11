import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne, ManyToOne, JoinColumn} from 'typeorm';
import {TeamFantasy} from './team-fantasy.entity';
import {PlayerProperty} from './player-property.entity';
import {User} from './user.entity';
import {LeagueCompetition} from './league-competition.entity';
import {LeagueScoring} from './league-scoring.entity';

export enum MultiplierTarget {
    RELEGATION = "RELEGATION",
    CHAMPIONS = "CHAMPIONS",
    BOTH = "BOTH"
}

@Entity("leagues")
export class League {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({length: 30})
    name!: string;

    @Column({default: false})
    renamed!: boolean;

    @Column({unique: true, length: 6})
    joinCode!: string;

    @ManyToOne(() => User, {nullable: false})
    @JoinColumn({name: 'ownerId'})
    owner!: User;

    @Column()
    ownerId!: number;

    @Column('int')
    pointReward!: number;

    @Column()
    captainEnabled!: boolean;

    @Column()
    multipliersEnabled!: boolean;       //If is false the other multiplier columns are disabled

    @Column({type: 'int', nullable: true})
    multiplierFinalMatchdays?: number | null;

    @Column({type: 'int', nullable: true})
    multiplierFactor?: number | null;

    @Column({type: 'enum', enum: MultiplierTarget, nullable: true})
    multiplierTarget?: MultiplierTarget | null;

    @CreateDateColumn()
    createdAt!: Date;

    @OneToMany(() => LeagueCompetition, (leagueCompetition) => leagueCompetition.league)
    competitions!: LeagueCompetition[];

    @OneToOne(() => LeagueScoring, (scoring) => scoring.league)
    scoring!: LeagueScoring;

    @OneToMany(() => TeamFantasy, (teamFantasy) => teamFantasy.league)
    teamsFantasy!: TeamFantasy[];

    @OneToMany(() => PlayerProperty, (playerProperty) => playerProperty.league)
    playerProperties!: PlayerProperty[];
}
