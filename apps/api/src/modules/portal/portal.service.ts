import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortalData(slug: string) {
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
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    const [categories, bookmarks] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId: tenant.id },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { bookmarks: true } },
        },
      }),
      this.prisma.bookmark.findMany({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
        orderBy: [
          { isPinned: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          faviconUrl: true,
          ogImageUrl: true,
          tags: true,
          isPinned: true,
          clickCount: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    const rootCategories = CategoryService.buildTree(categories);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        favicon: tenant.favicon,
        themeConfig: tenant.themeConfig,
      },
      categories: rootCategories,
      bookmarks,
      stats: {
        totalBookmarks: bookmarks.length,
        totalCategories: categories.length,
      },
    };
  }

  async searchPortal(slug: string, query: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.prisma.bookmark.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { url: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      orderBy: [
        { isPinned: 'desc' },
        { clickCount: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        faviconUrl: true,
        tags: true,
        isPinned: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
    });
  }

  async getByCategory(slug: string, categoryId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    return this.prisma.bookmark.findMany({
      where: {
        tenantId: tenant.id,
        categoryId,
        status: 'ACTIVE',
      },
      orderBy: [
        { isPinned: 'desc' },
        { sortOrder: 'asc' },
      ],
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        faviconUrl: true,
        tags: true,
        isPinned: true,
        categoryId: true,
      },
    });
  }
}
