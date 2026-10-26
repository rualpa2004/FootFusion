import { Module } from "@nestjs/common";
import { AccountCleanupService } from "../services/account-cleanup.service";
import { UserModule } from "./user.module";

@Module({
    imports: [UserModule],
    providers: [AccountCleanupService]
})
export class AccountCleanupModule {}
