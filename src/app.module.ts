import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BrokersModule } from './brokers/brokers.module';
import { StocksModule } from './stocks/stocks.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { LotsModule } from './lots/lots.module';
import { StrategiesModule } from './strategies/strategies.module';
import { PositionRulesModule } from './position-rules/position-rules.module';
import { SellHistoriesModule } from './sell-histories/sell-histories.module';
import { WatchlistsModule } from './watchlists/watchlists.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ErrorLogsModule } from './error-logs/error-logs.module';
import { AdminModule } from './admin/admin.module';
import { NoticesModule } from './notices/notices.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../.env'),
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    BrokersModule,
    StocksModule,
    ExchangeRatesModule,
    LotsModule,
    StrategiesModule,
    PositionRulesModule,
    SellHistoriesModule,
    WatchlistsModule,
    DashboardModule,
    ErrorLogsModule,
    AdminModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
