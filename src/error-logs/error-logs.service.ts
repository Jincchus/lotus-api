import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ErrorLog } from './error-log.entity';

interface SaveErrorDto {
  message: string;
  stack?: string;
  userId?: string | null;
  path?: string;
}

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly repo: Repository<ErrorLog>,
  ) {}

  async save(dto: SaveErrorDto): Promise<void> {
    const log = this.repo.create({
      message: dto.message.slice(0, 5000),
      stack: dto.stack ? dto.stack.slice(0, 10000) : null,
      userId: dto.userId ?? null,
      path: dto.path ? dto.path.slice(0, 500) : null,
    });
    await this.repo.save(log);
  }

  async findRecent(limit = 100): Promise<ErrorLog[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 500),
    });
  }

  @Cron('5 0 * * *') // 매일 00:05
  async deleteOldLogs(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    await this.repo.delete({ createdAt: LessThan(cutoff) });
  }
}
