import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma, Role } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt-strategy';

const DUMMY_HASH =
  '$2b$10$invalidhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXXXX';
const MAX_SESSIONS = 5;

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  phone: true,
  role: true,
  isVerified: true,
  createdAt: true,
} as const;

type SafeUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  private readonly refreshTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTtlDays =
      this.configService.get<number>('REFRESH_TTL_DAYS') ?? 30;
  }

  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const { password, avatar, ...userData } = dto;

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch {
      throw new InternalServerErrorException('Failed to process registration');
    }

    const userAvatar =
      avatar ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;

    try {
      const user = await this.prisma.user.create({
        data: { ...userData, password: hashedPassword, avatar: userAvatar },
        select: userSelect,
      });

      const tokens = await this.issueTokens(
        user.id,
        user.email,
        user.role,
        meta,
      );

      return {
        ...tokens,
        user: this.toSafeUser(user),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('email'))
          throw new ConflictException('Email already exists');
        if (target.includes('username'))
          throw new ConflictException('Username already exists');
        if (target.includes('phone'))
          throw new ConflictException('Phone number already exists');
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email, deletedAt: null },
        select: { ...userSelect, password: true },
      });

      const isMatch = await bcrypt.compare(
        password,
        user?.password ?? DUMMY_HASH,
      );

      if (!user || !isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      const tokens = await this.issueTokens(
        user.id,
        user.email,
        user.role,
        meta,
      );

      return {
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Login failed');
    }
  }

  async refresh(rawToken: string) {
    try {
      const hashed = this.hashToken(rawToken);

      const session = await this.prisma.session.findUnique({
        where: { refreshToken: hashed },
        include: { user: { select: { ...userSelect, deletedAt: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        if (session)
          await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Refresh token expired or invalid');
      }

      if (session.user.deletedAt !== null) {
        await this.prisma.session.deleteMany({
          where: { userId: session.user.id },
        });
        throw new UnauthorizedException('Account no longer exists');
      }

      await this.prisma.session.delete({ where: { id: session.id } });

      const tokens = await this.issueTokens(
        session.user.id,
        session.user.email,
        session.user.role,
        {
          userAgent: session.userAgent ?? undefined,
          ipAddress: session.ipAddress ?? undefined,
        },
      );

      return {
        ...tokens,
        user: this.toSafeUser(session.user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Token refresh failed');
    }
  }

  async logout(refreshToken: string) {
    try {
      const hashed = this.hashToken(refreshToken);
      await this.prisma.session.deleteMany({ where: { refreshToken: hashed } });
    } catch {
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async logoutAll(userId: string) {
    try {
      await this.prisma.session.deleteMany({ where: { userId } });
    } catch {
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async validateUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: userSelect,
      });
      if (!user) throw new UnauthorizedException('User not found');
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Failed to validate user');
    }
  }

  async getUserProfile(userId: string) {
    return this.validateUser(userId);
  }

  async getSessions(userId: string) {
    try {
      return await this.prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch sessions');
    }
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    try {
      const payload: JwtPayload = { sub: userId, email, role };
      const access_token = this.jwtService.sign(payload);

      const rawRefresh = crypto.randomBytes(40).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

      // enforce session cap — delete oldest if over limit
      const sessionCount = await this.prisma.session.count({
        where: { userId },
      });
      if (sessionCount >= MAX_SESSIONS) {
        const oldest = await this.prisma.session.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (oldest)
          await this.prisma.session.delete({ where: { id: oldest.id } });
      }

      await this.prisma.session.create({
        data: {
          userId,
          refreshToken: this.hashToken(rawRefresh),
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
          expiresAt,
        },
      });

      return { access_token, refresh_token: rawRefresh };
    } catch {
      throw new InternalServerErrorException('Failed to issue tokens');
    }
  }

  private toSafeUser(user: SafeUser): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
