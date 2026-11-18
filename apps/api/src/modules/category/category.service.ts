import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryTreeNode {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  children: CategoryTreeNode[];
  _count?: { bookmarks: number };
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCategoryDto) {
    // If parentId is specified, verify it exists and belongs to the same tenant
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        parentId: dto.parentId,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        _count: { select: { bookmarks: true, children: true } },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { bookmarks: true, children: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { bookmarks: true } },
          },
        },
        _count: { select: { bookmarks: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getTree(tenantId: string): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { bookmarks: true } },
      },
    });

    return this.buildTree(categories);
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If updating parentId, verify new parent exists and belongs to same tenant
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: {
        _count: { select: { bookmarks: true, children: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Move children up to parent (or make them root categories)
    await this.prisma.category.updateMany({
      where: { parentId: id, tenantId },
      data: { parentId: category.parentId },
    });

    // Unlink bookmarks from the deleted category
    await this.prisma.bookmark.updateMany({
      where: { categoryId: id, tenantId },
      data: { categoryId: null },
    });

    await this.prisma.category.delete({ where: { id } });

    return { deleted: true };
  }

  async reorder(tenantId: string, orderedIds: string[]) {
    // Update sortOrder for each category based on its position in the array
    const updates = orderedIds.map((id, index) =>
      this.prisma.category.updateMany({
        where: { id, tenantId },
        data: { sortOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return { reordered: true };
  }

  /**
   * Builds a tree structure from a flat list of categories.
   */
  private buildTree(
    categories: Array<{
      id: string;
      name: string;
      icon: string | null;
      sortOrder: number;
      parentId: string | null;
      _count: { bookmarks: number };
    }>,
  ): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Create all nodes
    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId,
        children: [],
        _count: cat._count,
      });
    }

    // Build parent-child relationships
    for (const cat of categories) {
      const node = map.get(cat.id)!;

      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
