import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany} from 'typeorm';
import {TeamFantasy} from './team-fantasy.entity';
import {Ban} from './ban.entity';
import {Offer} from './offer.entity';
import {History} from './history.entity';
import {Notification} from './notification.entity';

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}

@Entity("users")
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    firebaseUid!: string;

    @Column()
    name!: string;

    @Column({unique: true})
    email!: string;

    @Column({nullable: true})
    profilePhoto?: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER
    })
    role!: UserRole;

    @CreateDateColumn()
    registerDate!: Date;

    // One team per league (see TeamFantasy's unique constraint on user + league)
    @OneToMany(() => TeamFantasy, (teamFantasy) => teamFantasy.user)
    teamsFantasy!: TeamFantasy[];

    @OneToMany(() => Ban, (ban) => ban.admin)
    bansIssued!: Ban[];

    @OneToMany(() => Ban, (ban) => ban.targetUser)
    bansReceived!: Ban[];

    @OneToMany(() => Offer, (offer) => offer.user)
    offers!: Offer[];

    // Transactions where this user acquired a player (accepted offer or clause buyout)
    @OneToMany(() => History, (history) => history.user)
    acquisitions!: History[];

    // Transactions where this user sold/lost a player, when it had an owner
    @OneToMany(() => History, (history) => history.previousOwner)
    sales!: History[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications!: Notification[];
}
