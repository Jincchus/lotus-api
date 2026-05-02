import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { NoticesService } from './notices.service';

@Controller('notices')
@UseGuards(JwtAuthGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  /** 활성 공지 조회 (대시보드용) */
  @Get()
  findActive() {
    return this.noticesService.findActive();
  }

  /** 전체 공지 조회 (관리자) */
  @Get('all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.noticesService.findAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() body: { title: string; content: string },
    @CurrentUser() user: User,
  ) {
    return this.noticesService.create({ ...body, createdBy: user.id });
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ title: string; content: string; isActive: boolean }>,
  ) {
    return this.noticesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
