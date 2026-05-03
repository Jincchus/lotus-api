import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';

const ACCESS_TOKEN_TTL  = 60 * 60 * 1000;          // 1시간
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30일

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async login(user: User, res: Response): Promise<void> {
    const isProd = this.config.get<string>('app.env') === 'production';

    // Access Token (1시간)
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    // Refresh Token (랜덤 40바이트 → SHA-256 해시로 DB 저장)
    const rawRefresh = randomBytes(40).toString('hex');
    const tokenHash = this.hash(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

    await this.refreshTokenRepo.delete({ userId: user.id }); // 기존 세션 제거
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt }),
    );

    const cookieBase = { httpOnly: true, secure: isProd, sameSite: 'lax' as const };
    res.cookie('access_token',  accessToken, { ...cookieBase, maxAge: ACCESS_TOKEN_TTL });
    res.cookie('refresh_token', rawRefresh,  { ...cookieBase, maxAge: REFRESH_TOKEN_TTL });
  }

  async refresh(rawRefreshToken: string | undefined, res: Response): Promise<void> {
    if (!rawRefreshToken) throw new UnauthorizedException();

    const tokenHash = this.hash(rawRefreshToken);
    const stored = await this.refreshTokenRepo.findOneBy({ tokenHash });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user) throw new UnauthorizedException();

    // 토큰 회전: 기존 삭제 후 새 토큰 발급
    await this.login(user, res);
  }

  async logout(userId: string, res: Response): Promise<void> {
    await this.refreshTokenRepo.delete({ userId });
    const isProd = this.config.get<string>('app.env') === 'production';
    const cookieBase = { httpOnly: true, secure: isProd, sameSite: 'lax' as const };
    res.clearCookie('access_token',  cookieBase);
    res.clearCookie('refresh_token', cookieBase);
  }

  getProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
