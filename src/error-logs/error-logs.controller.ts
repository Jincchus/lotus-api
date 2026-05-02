import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ErrorLogsService } from './error-logs.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get('error-logs')
  findAll(@Query('limit') limit = 100) {
    return this.errorLogsService.findRecent(+limit);
  }
}
