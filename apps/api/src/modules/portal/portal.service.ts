import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
      },
    });

    if (!tenant || !tenant) {
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    // Get categories as tree
    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { bookmarks: true } },
      },
    });

    // Build category tree
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    for (const cat of categories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(node);
      } else {
        rootCategories.push(node);
      }
    }

    // Get all active bookmarks
    const bookmarks = await this.prisma.bookmark.findMany({
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
    });

    return {
      tenant,
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
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    if (!query || query.trim().length === 0) {
      return { data: [] };
    }

    const bookmarks = await this.prisma.bookmark.findMany({
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
        category: { select: { id: true, name: true } },
      },
    });

    return { data: bookmarks };
  }

  async getByCategory(slug: string, categoryId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Portal "${slug}" not found`);
    }

    const bookmarks = await this.prisma.bookmark.findMany({
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
      },
    });

    return { data: bookmarks };
  }
}
