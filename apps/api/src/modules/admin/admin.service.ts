import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

interface ListOptions {
  page: number;
  limit: number;
  search?: string;
  plan?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics() {
    const [totalTenants, activeTenants, totalUsers, totalBookmarks, totalCategories] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.bookmark.count(),
      this.prisma.category.count(),
    ]);

    // Plan distribution
    const planDistribution = await this.prisma.tenant.groupBy({
      by: ['plan'],
      _count: true,
    });

    // Recent tenants (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTenants = await this.prisma.tenant.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Top tenants by bookmarks
    const topTenants = await this.prisma.tenant.findMany({
      take: 5,
      select: {
        id: true, name: true, slug: true, plan: true,
        _count: { select: { bookmarks: true, users: true } },
      },
      orderBy: { bookmarks: { _count: 'desc' } },
    });

    return {
      overview: {
        totalTenants,
        activeTenants,
        frozenTenants: totalTenants - activeTenants,
        totalUsers,
        totalBookmarks,
        totalCategories,
        recentTenants,
      },
      planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count })),
      topTenants,
    };
  }

  async listTenants(opts: ListOptions) {
    const where: Prisma.TenantWhereInput = {};
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { slug: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    if (opts.plan) where.plan = opts.plan as any;
    if (opts.isActive !== undefined) where.isActive = opts.isActive;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, bookmarks: true, categories: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: { total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit) },
    };
  }

  async getTenantDetail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true } },
        _count: { select: { bookmarks: true, categories: true, users: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(id: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.plan && { plan: data.plan }),
        ...(data.maxBookmarks !== undefined && { maxBookmarks: data.maxBookmarks }),
        ...(data.maxMembers !== undefined && { maxMembers: data.maxMembers }),
      },
    });
  }

  async setTenantStatus(id: string, isActive: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.tenant.update({ where: { id }, data: { isActive } });
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    // Cascade delete handled by Prisma schema
    await this.prisma.tenant.delete({ where: { id } });
    return { deleted: true };
  }

  async listUsers(opts: ListOptions) {
    const where: Prisma.UserWhereInput = {};
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    if (opts.role) where.role = opts.role as Role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, avatarUrl: true,
          lastLogin: true, createdAt: true,
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit) },
    };
  }

  async updateUserRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ══════════════════════════════════════════════
  // AI Provider Management
  // ══════════════════════════════════════════════
  async listAiProviders() {
    const providers = await this.prisma.aiProvider.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        baseUrl: true,
        apiKey: true,
        model: true,
        isDefault: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mask API keys for security: show only last 4 chars
    return providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? `${'*'.repeat(Math.max(0, p.apiKey.length - 4))}${p.apiKey.slice(-4)}` : '',
    }));
  }

  async createAiProvider(data: {
    name: string;
    baseUrl: string;
    apiKey: string;
    model?: string;
    isDefault?: boolean;
    description?: string;
  }) {
    const existingCount = await this.prisma.aiProvider.count();
    const shouldBeDefault = data.isDefault ?? existingCount === 0;

    if (shouldBeDefault) {
      await this.prisma.aiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.aiProvider.create({
      data: {
        name: data.name.trim(),
        baseUrl: data.baseUrl.trim().replace(/\/+$/, ''),
        apiKey: data.apiKey.trim(),
        model: (data.model || 'gpt-4o-mini').trim(),
        isDefault: shouldBeDefault,
        description: data.description?.trim() || null,
      },
    });

    return {
      ...created,
      apiKey: created.apiKey ? `${'*'.repeat(Math.max(0, created.apiKey.length - 4))}${created.apiKey.slice(-4)}` : '',
    };
  }

  async updateAiProvider(id: string, data: {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    isDefault?: boolean;
    isActive?: boolean;
    description?: string;
  }) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');

    // If setting as default, unset all others first
    if (data.isDefault === true) {
      await this.prisma.aiProvider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.aiProvider.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.baseUrl !== undefined && { baseUrl: data.baseUrl.trim().replace(/\/+$/, '') }),
        ...(data.apiKey !== undefined && data.apiKey.trim() !== '' && { apiKey: data.apiKey.trim() }),
        ...(data.model !== undefined && { model: data.model.trim() }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.description !== undefined && { description: data.description.trim() || null }),
      },
    });

    return {
      ...updated,
      apiKey: updated.apiKey ? `${'*'.repeat(Math.max(0, updated.apiKey.length - 4))}${updated.apiKey.slice(-4)}` : '',
    };
  }

  async setDefaultAiProvider(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');

    // Unset all defaults, then set this one
    await this.prisma.aiProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.aiProvider.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });
  }

  async deleteAiProvider(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');
    await this.prisma.aiProvider.delete({ where: { id } });
    return { deleted: true };
  }

  async testAiProvider(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { success: false, status: response.status, error: errorBody };
      }

      const data = await response.json() as any;
      const reply = data.choices?.[0]?.message?.content || '';
      return { success: true, status: response.status, reply: reply.trim(), model: provider.model };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  }
}
