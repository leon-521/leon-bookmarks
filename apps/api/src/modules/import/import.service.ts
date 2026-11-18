import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseBookmarkHtml, ParsedFolder, ParsedBookmark } from './bookmark-parser';
import { getDefaultFaviconUrl } from '../../common/utils/url.util';

interface ImportOptions {
  createCategories: boolean;
  defaultCategoryId?: string;
  skipDuplicates: boolean;
}

export interface ImportResult {
  importedBookmarks: number;
  importedCategories: number;
  skippedDuplicates: number;
  errors: string[];
}

const SKIP_BROWSER_ROOT_FOLDERS = new Set([
  'bookmarks bar',
  'other bookmarks',
  'mobile bookmarks',
  '书签栏',
  '其他书签',
  '移动设备书签',
]);

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  private async getQuotaContext(tenantId: string) {
    const [tenant, existingBookmarks] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxBookmarks: true },
      }),
      this.prisma.bookmark.findMany({
        where: { tenantId },
        select: { url: true },
      }),
    ]);

    const maxBookmarks = tenant?.maxBookmarks ?? 500;
    const remainingQuota =
      maxBookmarks > 0 ? Math.max(0, maxBookmarks - existingBookmarks.length) : Infinity;

    return {
      maxBookmarks,
      remainingQuota,
      existingUrls: new Set(existingBookmarks.map((b) => b.url)),
    };
  }

  async importFromHtml(
    tenantId: string,
    userId: string,
    htmlContent: string,
    options: ImportOptions = { createCategories: true, skipDuplicates: true },
  ): Promise<ImportResult> {
    const parsed = parseBookmarkHtml(htmlContent);

    if (parsed.totalCount === 0) {
      throw new BadRequestException('No bookmarks found in the uploaded file');
    }

    if (options.defaultCategoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: options.defaultCategoryId, tenantId },
        select: { id: true },
      });
      if (!cat) {
        throw new BadRequestException('Default category does not exist in this workspace');
      }
    }

    const result: ImportResult = {
      importedBookmarks: 0,
      importedCategories: 0,
      skippedDuplicates: 0,
      errors: [],
    };

    const quota = await this.getQuotaContext(tenantId);
    const assignedBookmarks = new Set<ParsedBookmark>();

    const insertBookmark = async (bm: ParsedBookmark, categoryId?: string | null) => {
      if (!bm.url.startsWith('http://') && !bm.url.startsWith('https://')) {
        return;
      }
      if (options.skipDuplicates && quota.existingUrls.has(bm.url)) {
        result.skippedDuplicates++;
        return;
      }
      if (result.importedBookmarks >= quota.remainingQuota) {
        if (!result.errors.some((e) => e.includes('Bookmark limit reached'))) {
          result.errors.push(`Bookmark limit reached (${quota.maxBookmarks}). Remaining items were skipped.`);
        }
        return;
      }

      try {
        await this.prisma.bookmark.create({
          data: {
            tenantId,
            createdById: userId,
            title: bm.title || bm.url,
            url: bm.url,
            categoryId: categoryId || options.defaultCategoryId || null,
            faviconUrl: getDefaultFaviconUrl(bm.url),
            tags: [],
            status: 'ACTIVE',
          },
        });
        result.importedBookmarks++;
        quota.existingUrls.add(bm.url);
      } catch (error: any) {
        result.errors.push(`Failed to import "${bm.title}": ${error.message}`);
      }
    };

    const traverseFolder = async (folder: ParsedFolder, parentId: string | null) => {
      let currentCategoryId = parentId;

      if (options.createCategories && !SKIP_BROWSER_ROOT_FOLDERS.has(folder.name.trim().toLowerCase())) {
        let category = await this.prisma.category.findFirst({
          where: { tenantId, name: folder.name, parentId },
        });
        if (!category) {
          category = await this.prisma.category.create({
            data: {
              tenantId,
              name: folder.name,
              parentId,
              sortOrder: result.importedCategories,
            },
          });
          result.importedCategories++;
        }
        currentCategoryId = category.id;
      }

      for (const child of folder.children) {
        if ('children' in child) {
          await traverseFolder(child as ParsedFolder, currentCategoryId);
        } else {
          const bm = child as ParsedBookmark;
          assignedBookmarks.add(bm);
          await insertBookmark(bm, currentCategoryId);
        }
      }
    };

    for (const folder of parsed.folders) {
      await traverseFolder(folder, null);
    }

    // Import any top-level bookmarks that were not inside a folder
    for (const bm of parsed.bookmarks) {
      if (!assignedBookmarks.has(bm)) {
        await insertBookmark(bm, options.defaultCategoryId || null);
      }
    }

    return result;
  }

  async importFromJson(
    tenantId: string,
    userId: string,
    jsonContent: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      importedBookmarks: 0,
      importedCategories: 0,
      skippedDuplicates: 0,
      errors: [],
    };

    let data: any[];
    try {
      const parsed = JSON.parse(jsonContent);
      data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.bookmarks) ? parsed.bookmarks : [parsed];
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }

    const quota = await this.getQuotaContext(tenantId);

    for (const item of data) {
      try {
        const url = item?.url || item?.href || item?.link;
        const title = item?.title || item?.name || url;

        if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
          continue;
        }

        if (quota.existingUrls.has(url)) {
          result.skippedDuplicates++;
          continue;
        }

        if (result.importedBookmarks >= quota.remainingQuota) {
          if (!result.errors.some((e) => e.includes('Bookmark limit reached'))) {
            result.errors.push(`Bookmark limit reached (${quota.maxBookmarks}). Remaining items were skipped.`);
          }
          break;
        }

        await this.prisma.bookmark.create({
          data: {
            tenantId,
            createdById: userId,
            title: String(title).trim() || url,
            url,
            description: item.description || item.desc || null,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            faviconUrl: getDefaultFaviconUrl(url),
            status: 'ACTIVE',
          },
        });

        result.importedBookmarks++;
        quota.existingUrls.add(url);
      } catch (error: any) {
        result.errors.push(`Failed: ${error.message}`);
      }
    }

    return result;
  }

  async exportBookmarks(tenantId: string, format: 'html' | 'json' | 'csv' = 'html') {
    const [categories, bookmarks] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.bookmark.findMany({
        where: { tenantId, status: { not: 'ARCHIVED' } },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    if (format === 'json') {
      return {
        format: 'json',
        filename: `bookmarks-export-${new Date().toISOString().slice(0, 10)}.json`,
        content: JSON.stringify(
          bookmarks.map((b) => ({
            title: b.title,
            url: b.url,
            description: b.description,
            category: b.category?.name || null,
            tags: b.tags,
            isPinned: b.isPinned,
            createdAt: b.createdAt,
          })),
          null,
          2,
        ),
      };
    }

    if (format === 'csv') {
      const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      const header = 'Title,URL,Description,Category,Tags,CreatedAt';
      const rows = bookmarks.map((b) =>
        [
          escapeCsv(b.title),
          escapeCsv(b.url),
          escapeCsv(b.description || ''),
          escapeCsv(b.category?.name || ''),
          escapeCsv(b.tags.join(';')),
          escapeCsv(b.createdAt.toISOString()),
        ].join(','),
      );
      return {
        format: 'csv',
        filename: `bookmarks-export-${new Date().toISOString().slice(0, 10)}.csv`,
        content: [header, ...rows].join('\n'),
      };
    }

    const escHtml = (s: string) =>
      (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const byCat = new Map<string | null, typeof bookmarks>();
    for (const bm of bookmarks) {
      const key = bm.categoryId || null;
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(bm);
    }

    const lines: string[] = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
      '<TITLE>Leon Bookmarks Export</TITLE>',
      '<H1>Bookmarks</H1>',
      '<DL><p>',
    ];

    for (const cat of categories) {
      const catItems = byCat.get(cat.id) || [];
      if (catItems.length === 0) continue;
      lines.push(`    <DT><H3>${escHtml(cat.name)}</H3>`);
      lines.push('    <DL><p>');
      for (const bm of catItems) {
        const ts = Math.floor(bm.createdAt.getTime() / 1000);
        lines.push(`        <DT><A HREF="${escHtml(bm.url)}" ADD_DATE="${ts}">${escHtml(bm.title)}</A>`);
      }
      lines.push('    </DL><p>');
    }

    const uncategorized = byCat.get(null) || [];
    for (const bm of uncategorized) {
      const ts = Math.floor(bm.createdAt.getTime() / 1000);
      lines.push(`    <DT><A HREF="${escHtml(bm.url)}" ADD_DATE="${ts}">${escHtml(bm.title)}</A>`);
    }

    lines.push('</DL><p>');

    return {
      format: 'html',
      filename: `bookmarks-export-${new Date().toISOString().slice(0, 10)}.html`,
      content: lines.join('\n'),
    };
  }
}
