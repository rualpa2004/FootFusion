import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { History } from "../entities/history.entity";
import { HistoryRepository } from "../repositories/history.repository";

@Module({
    imports: [TypeOrmModule.forFeature([History])],
    providers: [HistoryRepository],
    exports: [HistoryRepository]
})
export class HistoryModule {}