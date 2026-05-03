import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  profileImage?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ id });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ googleId });
  }

  private static readonly ADMIN_EMAILS = ['chopoo2001@gmail.com'];

  async updateDefaultStrategy(userId: string, strategyId: string | null): Promise<void> {
    await this.usersRepo.update(userId, { defaultStrategyId: strategyId });
  }

  async findOrCreate(profile: GoogleProfile): Promise<User> {
    const isAdmin = UsersService.ADMIN_EMAILS.includes(profile.email);
    let user = await this.findByGoogleId(profile.googleId);
    if (!user) {
      user = this.usersRepo.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        profileImage: profile.profileImage ?? null,
        role: isAdmin ? 'admin' : 'user',
      });
      user = await this.usersRepo.save(user);
    } else if (isAdmin && user.role !== 'admin') {
      user.role = 'admin';
      user = await this.usersRepo.save(user);
    }
    return user;
  }
}
