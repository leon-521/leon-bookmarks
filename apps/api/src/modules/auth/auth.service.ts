import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedSlug = dto.tenantSlug.toLowerCase().trim();

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingUserCount = await tx.user.count();
      const initialRole = existingUserCount === 0 ? Role.SUPER_ADMIN : Role.ADMIN;

      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName.trim(),
          slug: normalizedSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: normalizedEmail,
          name: dto.name.trim(),
          password: hashedPassword,
          role: initialRole,
        },
      });

      return { tenant, user };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.tenantId,
      result.user.email,
      result.user.role,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: { tenant: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.tenant.isActive && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('This workspace has been suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET', 'default-secret');

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      if (payload.tokenType && payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: { select: { isActive: true } } },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.tenant.isActive && user.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('This workspace has been suspended');
      }

      return this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.role,
      );
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logo: true,
            customDomain: true,
            themeConfig: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
  ) {
    const basePayload = { sub: userId, tenantId, email, role };
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET', 'default-secret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, tokenType: 'access' },
        {
          expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, tokenType: 'refresh' },
        {
          secret: refreshSecret,
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_EXPIRATION',
            '7d',
          ),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
