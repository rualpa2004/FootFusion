import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import {PlayerProperty} from './player-property.entity';
import {User} from './user.entity';
import {Market} from './market.entity';

export enum OfferStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}

@Entity("offers")
export class Offer {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => PlayerProperty, (playerProperty) => playerProperty.offers, {nullable: false})
    @JoinColumn({name: 'playerPropertyId'})
    playerProperty!: PlayerProperty;

    @Column()
    playerPropertyId!: number;

    // The user making the offer (if null the offer is auto-generated)
    @ManyToOne(() => User, (user) => user.offers, {nullable: true})
    @JoinColumn({name: 'userId'})
    user?: User | null;

    @Column({type: 'int', nullable: true})
    userId?: number | null;

    // Market listing this offer is made against
    @ManyToOne(() => Market, (market) => market.offers, {nullable: false})
    @JoinColumn({name: 'marketId'})
    market!: Market;

    @Column()
    marketId!: number;

    @Column('int')
    amount!: number;

    @Column({
        type: 'enum',
        enum: OfferStatus,
        default: OfferStatus.PENDING
    })
    status!: OfferStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({nullable: true})
    respondedAt?: Date;
}
