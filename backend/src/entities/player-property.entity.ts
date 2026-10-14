import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique} from 'typeorm';
import {TeamFantasy} from './team-fantasy.entity';
import {League} from './league.entity';
import {Offer} from './offer.entity';
import {Market} from './market.entity';
import {History} from './history.entity';

// Each real player has one PlayerProperty per league
@Entity("player_properties")
@Unique(['externalPlayerId', 'league'])
export class PlayerProperty {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    externalPlayerId!: number;

    @ManyToOne(() => League, (league) => league.playerProperties, {nullable: false})
    @JoinColumn({name: 'leagueId'})
    league!: League;

    @Column()
    leagueId!: number;

    // Null means the player is a free agent (no fantasy team owns it yet)
    @ManyToOne(() => TeamFantasy, (teamFantasy) => teamFantasy.players, {nullable: true})
    @JoinColumn({ name: 'teamFantasyId' })
    teamFantasy?: TeamFantasy;

    @Column({nullable: true})
    teamFantasyId?: number;

    @Column('int')
    marketValue!: number;

    // Release clause: amount another user must pay to buy the player ("clausulazo")
    @Column('int')
    clauseValue!: number;

    @Column({default: 0})
    totalPoints!: number;

    @Column({nullable: true})
    acquiredAt?: Date;

    @Column({nullable: true})
    shieldedAt?: Date;

    @OneToMany(() => Offer, (offer) => offer.playerProperty)
    offers!: Offer[];

    @OneToMany(() => Market, (market) => market.playerProperty)
    marketListings!: Market[];

    @OneToMany(() => History, (history) => history.playerProperty)
    historyEntries!: History[];
}
