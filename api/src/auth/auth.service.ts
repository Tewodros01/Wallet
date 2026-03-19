import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            avatar: userAvatar,
            isVerified: true,
          },
          select: userSelect,
        });
        // auto-create default wallet so all wallet-dependent features work immediately
        await tx.wallet.create({
          data: {
            name: 'Main Wallet',
            userId: created.id,
            isDefault: true,
            isActive: true,
          },
        });
        return created;
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
      if (!user) throw new UnauthorizedException('User not found');
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
      const hashed = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      // revoke all sessions so user must re-login
      await this.prisma.session.deleteMany({ where: { userId } });
      return { success: true };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  async revokeSession(userId: string, sessionId: string) {
    try {
      await this.prisma.session.deleteMany({ where: { id: sessionId, userId } });
      return { success: true };
    } catch {
      throw new InternalServerErrorException('Failed to revoke session');
    }
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

  // ── Forgot / Reset password ───────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email, deletedAt: null },
        select: { id: true, email: true },
      });
      // Always return success to prevent email enumeration
      if (!user) return { message: 'If that email exists, a reset link has been sent.' };

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in session table reusing the same pattern
      // We use a dedicated prefix so it never collides with refresh tokens
      await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: `reset:${hashedToken}`,
          expiresAt,
        },
      });

      // In production you would email rawToken. We return it here for
      // demo/dev purposes — replace with your email provider.
      return {
        message: 'If that email exists, a reset link has been sent.',
        resetToken: rawToken, // REMOVE in production, send via email instead
      };
    } catch {
      throw new InternalServerErrorException('Failed to process password reset');
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const hashedToken = this.hashToken(rawToken);
      const session = await this.prisma.session.findFirst({
        where: { refreshToken: `reset:${hashedToken}` },
        include: { user: { select: { id: true, deletedAt: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        if (session) await this.prisma.session.delete({ where: { id: session.id } });
        throw new BadRequestException('Reset token is invalid or has expired');
      }

      if (session.user.deletedAt) {
        throw new NotFoundException('Account not found');
      }

      const hashed = await bcrypt.hash(newPassword, 10);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: session.userId }, data: { password: hashed } });
        // Invalidate the reset token
        await tx.session.delete({ where: { id: session.id } });
        // Revoke all active sessions so attacker sessions are killed
        await tx.session.deleteMany({ where: { userId: session.userId } });
      });

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to reset password');
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
