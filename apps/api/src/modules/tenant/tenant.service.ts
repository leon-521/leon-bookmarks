import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto, UpdateThemeDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            bookmarks: true,
            categories: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        favicon: true,
        themeConfig: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(tenantId: string, requestingTenantId: string, dto: UpdateTenantDto) {
    if (tenantId !== requestingTenantId) {
      throw new ForbiddenException('Cannot update another tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const normalizedDomain =
      dto.customDomain !== undefined
        ? dto.customDomain.trim() || null
        : undefined;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.logo !== undefined && { logo: dto.logo.trim() || null }),
        ...(dto.favicon !== undefined && { favicon: dto.favicon.trim() || null }),
        ...(normalizedDomain !== undefined && { customDomain: normalizedDomain }),
      },
    });
  }

  async updateTheme(tenantId: string, requestingTenantId: string, dto: UpdateThemeDto) {
    if (tenantId !== requestingTenantId) {
      throw new ForbiddenException('Cannot update another tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { themeConfig: dto.themeConfig },
    });
  }

  async listMembers(tenantId: string) {
    const [tenant, members] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, plan: true, maxMembers: true },
      }),
      this.prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          lastLogin: true,
          createdAt: true,
          _count: { select: { bookmarks: true } },
        },
      }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      members,
      quota: {
        used: members.length,
        limit: tenant.maxMembers,
        plan: tenant.plan,
      },
    };
  }

  async inviteMember(
    tenantId: string,
    dto: { email: string; name: string; role?: Role; password?: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxMembers: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const currentCount = await this.prisma.user.count({ where: { tenantId } });
    if (tenant.maxMembers > 0 && currentCount >= tenant.maxMembers) {
      throw new ForbiddenException(
        `Team member limit reached (${tenant.maxMembers}). Upgrade your plan to invite more members.`,
      );
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: normalizedEmail } },
    });
    if (existing) {
      throw new ConflictException('A member with this email already exists in this workspace');
    }

    const normalizedRole = dto.role ? (String(dto.role).toUpperCase() as Role) : undefined;
    const assignedRole =
      normalizedRole && ([Role.ADMIN, Role.EDITOR, Role.VIEWER] as Role[]).includes(normalizedRole)
        ? normalizedRole
        : Role.EDITOR;

    const rawPassword = dto.password || 'Welcome123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: normalizedEmail,
        name: dto.name.trim(),
        password: hashedPassword,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateMemberRole(
    tenantId: string,
    requesterId: string,
    requesterRole: Role,
    memberId: string,
    roleInput: Role,
  ) {
    const role = String(roleInput || '').toUpperCase() as Role;
    if (!([Role.ADMIN, Role.EDITOR, Role.VIEWER] as Role[]).includes(role)) {
      throw new BadRequestException('Invalid workspace role');
    }
    if (requesterId === memberId) {
      throw new BadRequestException('You cannot modify your own role');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === Role.SUPER_ADMIN && requesterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify a Super Admin account');
    }

    return this.prisma.user.update({
      where: { id: memberId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async removeMember(
    tenantId: string,
    requesterId: string,
    requesterRole: Role,
    memberId: string,
  ) {
    if (requesterId === memberId) {
      throw new BadRequestException('You cannot remove yourself from the workspace');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === Role.SUPER_ADMIN && requesterRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot remove a Super Admin account');
    }

    await this.prisma.user.delete({ where: { id: memberId } });
    return { deleted: true };
  }
}
