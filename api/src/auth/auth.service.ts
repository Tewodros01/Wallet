import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt-strategy';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { password, avatar, ...userData } = dto;
    const hashPassword = await bcrypt.hash(password, 10);

    const userAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;

    try {
      const user = await this.prisma.user.create({
        data: { ...userData, password: hashPassword, avatar: userAvatar },
        select: userSelect,
      });

      return {
        access_token: this.jwtService.sign(this.buildPayload(user)),
        user,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('email'))
          throw new ConflictException('Email already exists');
        if (target.includes('username'))
          throw new ConflictException('Username already exists');
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: { ...userSelect, password: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.jwtService.sign(this.buildPayload(user)),
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
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: userSelect,
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async getUserProfile(userId: string) {
    return this.validateUser(userId);
  }

  private buildPayload(user: {
    id: string;
    email: string;
    role: Role;
  }): JwtPayload {
    return { sub: user.id, email: user.email, role: user.role };
  }
}
