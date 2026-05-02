import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Stock } from '../stocks/stock.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  // ── 사용자 관리 ──────────────────────────────────────────

  findAllUsers(): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>[]> {
    return this.userRepo.find({
      select: ['id', 'email', 'name', 'role', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateUserRole(id: string, role: 'user' | 'admin'): Promise<{ id: string; role: string }> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    await this.userRepo.save(user);
    return { id: user.id, role: user.role };
  }

  // ── 종목 보정 ────────────────────────────────────────────

  findAllStocks(): Promise<Stock[]> {
    return this.stockRepo.find({ order: { symbol: 'ASC' } });
  }

  async updateStock(
    id: string,
    data: Partial<{ name: string; market: string; currency: string }>,
  ): Promise<Stock> {
    const stock = await this.stockRepo.findOneBy({ id });
    if (!stock) throw new NotFoundException('Stock not found');
    Object.assign(stock, data);
    return this.stockRepo.save(stock);
  }

  // ── 시스템 상태 ──────────────────────────────────────────

  getSystemStatus() {
    const mem = process.memoryUsage();
    return {
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
