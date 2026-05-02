import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ErrorLog } from './error-log.entity';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogsController } from './error-logs.controller';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorLog])],
  providers: [
    ErrorLogsService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  controllers: [ErrorLogsController],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
