import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import {User} from './user.entity';

@Entity("bans")
export class Ban {

    @PrimaryGeneratedColumn()
    id!: number;

    // The administrator who will ban an user
    @ManyToOne(() => User, (user) => user.bansIssued, {nullable: false})
    @JoinColumn({ name: 'adminId' })
    admin!: User;

    @Column()
    adminId!: number;

    // The user who was banned
    @ManyToOne(() => User, (user) => user.bansReceived, {nullable: false})
    @JoinColumn({name: 'targetUserId'})
    targetUser!: User;

    @Column()
    targetUserId!: number;

    @Column()
    reason!: string;

    @CreateDateColumn()
    bannedAt!: Date;

    // Null == permanent ban
    @Column({nullable: true})
    expiresAt?: Date;

    @Column({default: true})
    active!: boolean;
}
