import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { BookmarkFilterDto } from './dto/bookmark-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateBookmarkDto) {
    // Check tenant bookmark limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxBookmarks: true },
    });

    const bookmarkCount = await this.prisma.bookmark.count({
      where: { tenantId },
    });

    if (tenant && bookmarkCount >= tenant.maxBookmarks) {
      throw new ForbiddenException(
        `Bookmark limit reached (${tenant.maxBookmarks}). Upgrade your plan for more.`,
      );
    }

    // Auto-generate a favicon URL stub from the bookmark URL
    let faviconUrl: string | undefined;
    try {
      const url = new URL(dto.url);
      faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
      // Invalid URL — skip favicon
    }

    return this.prisma.bookmark.create({
      data: {
        tenantId,
        createdById: userId,
        title: dto.title,
        url: dto.url,
        description: dto.description,
        categoryId: dto.categoryId,
        tags: dto.tags || [],
        sortOrder: dto.sortOrder ?? 0,
        isPinned: dto.isPinned ?? false,
        faviconUrl,
      },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(tenantId: string, filters: BookmarkFilterDto) {
    const {
      search,
      categoryId,
      status,
      tag,
      isPinned,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.BookmarkWhereInput = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (isPinned !== undefined) {
      where.isPinned = isPinned;
    }

    // Build orderBy — allow sorting by known fields only
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'clickCount',
      'sortOrder',
    ];
    const orderByField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const orderBy: Prisma.BookmarkOrderByWithRelationInput = {
      [orderByField]: sortOrder,
    };

    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      data: bookmarks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return bookmark;
  }

  async update(tenantId: string, id: string, dto: UpdateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, tenantId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: dto,
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, tenantId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({ where: { id } });
    return { deleted: true };
  }

  async batchDelete(tenantId: string, ids: string[]) {
    const result = await this.prisma.bookmark.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return { deletedCount: result.count };
  }

  async batchMove(tenantId: string, ids: string[], categoryId: string | null) {
    const result = await this.prisma.bookmark.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: { categoryId },
    });

    return { updatedCount: result.count };
  }

  async incrementClickCount(tenantId: string, id: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, tenantId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
  }
}
