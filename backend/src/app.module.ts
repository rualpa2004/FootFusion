import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UserModule } from './modules/user.module';
import { BanModule } from './modules/ban.module';
import { TeamFantasyModule } from './modules/team-fantasy.module';
import { NotificationModule } from './modules/notification.module';
import { PlayerPropertyModule } from './modules/player-property.module';
import { MarketModule } from './modules/market.module';
import { LeagueModule } from './modules/league.module';
import { HistoryModule } from './modules/history.module';
import { OfferModule } from './modules/offer.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_MYSQL_HOST'),
        port: configService.get<number>('DB_MYSQL_PORT'),
        username: configService.get<string>('DB_MYSQL_USER'),
        password: configService.get<string>('DB_MYSQL_PASSWORD'),
        database: configService.get<string>('DB_MYSQL_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true   //NEEDED AT DEVELOP
      })
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_MONGO_URI')
      })
    }),
    UserModule,
    BanModule,
    TeamFantasyModule,
    NotificationModule,
    PlayerPropertyModule,
    MarketModule,
    LeagueModule,
    HistoryModule,
    OfferModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
