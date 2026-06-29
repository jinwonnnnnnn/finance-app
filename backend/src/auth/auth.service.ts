import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, nickname: dto.nickname, provider: 'local' },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    return this.issueTokens(user.id, user.email);
  }

  async oauthLogin(profile: { providerId: string; email: string; nickname: string; provider: string }) {
    let user = await this.prisma.user.findFirst({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (!user) {
      const emailUser = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (emailUser) {
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: { provider: profile.provider, providerId: profile.providerId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            nickname: profile.nickname,
            provider: profile.provider,
            providerId: profile.providerId,
          },
        });
      }
    }

    return this.issueTokens(user.id, user.email);
  }

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  verifyRefresh(token: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
  }
}
