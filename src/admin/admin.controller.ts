import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── 사용자 관리 ──────────────────────────────────────────

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  // ── 종목 보정 ────────────────────────────────────────────

  @Get('stocks')
  findAllStocks() {
    return this.adminService.findAllStocks();
  }

  @Patch('stocks/:id')
  updateStock(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; market: string; currency: string }>,
  ) {
    return this.adminService.updateStock(id, body);
  }

  // ── 시스템 상태 ──────────────────────────────────────────

  @Get('system-status')
  getSystemStatus() {
    return this.adminService.getSystemStatus();
  }
}
