import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
    OFFER_RECEIVED = "OFFER_RECEIVED",
    OFFER_ACCEPTED = "OFFER_ACCEPTED",
    OFFER_REJECTED = "OFFER_REJECTED",
    PLAYER_SOLD = "PLAYER_SOLD",
    CLAUSE_BUYOUT = "CLAUSE_BUYOUT",
    LEAGUE_INVITE = "LEAGUE_INVITE",
    BAN = "BAN",
    SYSTEM = "SYSTEM"
}

@Entity("notifications")
export class Notification {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: number;

    @Column({
        type: 'enum',
        enum: NotificationType
    })
    type!: NotificationType;

    @Column()
    title!: string;

    @Column()
    message!: string;

    @Column({ default: false })
    read!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
