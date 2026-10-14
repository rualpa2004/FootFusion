import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn} from 'typeorm';
import {PlayerProperty} from './player-property.entity';
import {Offer} from './offer.entity';

export enum MarketListingStatus {
    ACTIVE = "ACTIVE",
    SOLD = "SOLD",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}

@Entity("markets")
export class Market {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => PlayerProperty, (playerProperty) => playerProperty.marketListings, {nullable: false})
    @JoinColumn({name: 'playerPropertyId'})
    playerProperty!: PlayerProperty;

    @Column()
    playerPropertyId!: number;

    @Column('int')
    askingPrice!: number;

    @Column({
        type: 'enum',
        enum: MarketListingStatus,
        default: MarketListingStatus.ACTIVE
    })
    status!: MarketListingStatus;

    @CreateDateColumn()
    listedAt!: Date;

    @Column({nullable: true})
    expiresAt?: Date;

    @OneToMany(() => Offer, (offer) => offer.market)
    offers!: Offer[];
}
