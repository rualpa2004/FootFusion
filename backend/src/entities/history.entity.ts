import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import {User} from './user.entity';
import {PlayerProperty} from './player-property.entity';

export enum HistoryEntryType {
    OFFER_ACCEPTED = "OFFER_ACCEPTED",
    CLAUSE_BUYOUT = "CLAUSE_BUYOUT",
    RETURNED_TO_MARKET = "RETURNED_TO_MARKET"
}

@Entity("histories")
export class History {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: HistoryEntryType
    })
    type!: HistoryEntryType;

    @ManyToOne(() => PlayerProperty, (playerProperty) => playerProperty.historyEntries, {nullable: false})
    @JoinColumn({name: 'playerPropertyId'})
    playerProperty!: PlayerProperty;

    @Column()
    playerPropertyId!: number;

    // The user who acquires the player. Null means the player was RETURNED_TO_MARKET
    @ManyToOne(() => User, (user) => user.acquisitions, {nullable: true})
    @JoinColumn({name: 'userId'})
    user?: User | null;

    @Column({type: 'int', nullable: true})
    userId?: number | null;

    // The user who owned the player before the transfer. Null means the player hadn't previous owner
    @ManyToOne(() => User, (user) => user.sales, {nullable: true})
    @JoinColumn({name: 'previousOwnerId'})
    previousOwner?: User | null;

    @Column({type: 'int', nullable: true})
    previousOwnerId?: number | null;

    @Column('int')
    price!: number;

    @CreateDateColumn()
    date!: Date;
}
