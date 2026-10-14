import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "../entities/notification.entity";
import { NotificationRepository } from "../repositories/notification.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    providers: [NotificationRepository],
    exports: [NotificationRepository]
})
export class NotificationModule {}