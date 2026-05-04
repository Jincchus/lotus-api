import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theme } from './theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private readonly themeRepo: Repository<Theme>,
  ) {}

  async create(userId: string, dto: CreateThemeDto): Promise<Theme> {
    const existing = await this.themeRepo.findOneBy({
      user: { id: userId },
      name: dto.name,
    });
    if (existing) throw new ConflictException('이미 동일한 이름의 테마가 있습니다.');

    const theme = this.themeRepo.create({ user: { id: userId }, name: dto.name });
    return this.themeRepo.save(theme);
  }

  async findAll(userId: string): Promise<Theme[]> {
    return this.themeRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, userId: string, dto: UpdateThemeDto): Promise<Theme> {
    const theme = await this.findOwned(id, userId);
    theme.name = dto.name;
    return this.themeRepo.save(theme);
  }

  async remove(id: string, userId: string): Promise<void> {
    const theme = await this.findOwned(id, userId);
    await this.themeRepo.remove(theme);
  }

  async findOwned(id: string, userId: string): Promise<Theme> {
    const theme = await this.themeRepo.findOneBy({ id, user: { id: userId } });
    if (!theme) throw new NotFoundException('테마를 찾을 수 없습니다.');
    return theme;
  }
}
