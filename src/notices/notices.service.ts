import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './notice.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly repo: Repository<Notice>,
  ) {}

  findActive(): Promise<Notice[]> {
    return this.repo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  findAll(): Promise<Notice[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: { title: string; content: string; createdBy: string }): Promise<Notice> {
    return this.repo.save(this.repo.create({ ...data, isActive: true }));
  }

  async update(id: string, data: Partial<{ title: string; content: string; isActive: boolean }>): Promise<Notice> {
    const notice = await this.repo.findOneBy({ id });
    if (!notice) throw new NotFoundException();
    Object.assign(notice, data);
    return this.repo.save(notice);
  }

  async remove(id: string): Promise<void> {
    const notice = await this.repo.findOneBy({ id });
    if (!notice) throw new NotFoundException();
    await this.repo.remove(notice);
  }
}
