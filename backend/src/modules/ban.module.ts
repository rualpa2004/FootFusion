import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Ban } from "../entities/ban.entity";
import { BanRepository } from "../repositories/ban.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Ban])],
    providers: [BanRepository],
    exports: [BanRepository]
})
export class BanModule {}