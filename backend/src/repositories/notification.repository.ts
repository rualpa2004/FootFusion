import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Notification} from "../entities/notification.entity";

@Injectable()
export class NotificationRepository {

    constructor(
        @InjectRepository(Notification)
        private readonly repository: Repository<Notification>
    ) {}

    findAll(): Promise<Notification[]> {
        return this.repository.find();
    }

    findById(id: number): Promise<Notification | null> {
        return this.repository.findOne({where: {id}});
    }

    findByUser(userId: number): Promise<Notification[]> {
        return this.repository.find({where: {userId}, order: {createdAt: "DESC"}});
    }

    findUnreadByUser(userId: number): Promise<Notification[]> {
        return this.repository.find({where: {userId, read: false}, order: {createdAt: "DESC"}});
    }

    async markAsRead(id: number): Promise<void> {
        await this.repository.update({id}, {read: true});
    }

    async markAllAsReadByUser(userId: number): Promise<void> {
        await this.repository.update({userId, read: false}, {read: true});
    }

    create(data: Partial<Notification>): Promise<Notification> {
        const notification = this.repository.create(data);
        return this.repository.save(notification);
    }

    save(notification: Notification): Promise<Notification> {
        return this.repository.save(notification);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
