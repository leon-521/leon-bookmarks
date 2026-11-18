import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseBookmarkHtml, ParsedFolder, ParsedBookmark } from './bookmark-parser';

interface ImportOptions {
  createCategories: boolean;
  defaultCategoryId?: string;
  skipDuplicates: boolean;
}

interface ImportResult {
  importedBookmarks: number;
  importedCategories: number;
  skippedDuplicates: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

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

    const result: ImportResult = {
      importedBookmarks: 0,
      importedCategories: 0,
      skippedDuplicates: 0,
      errors: [],
    };

    // Get existing bookmark URLs to check duplicates
    const existingBookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId },
      select: { url: true },
    });
    const existingUrls = new Set(existingBookmarks.map(b => b.url));

    // Process folders as categories
    const categoryMap = new Map<string, string>(); // folder name -> category id

    if (options.createCategories && parsed.folders.length > 0) {
      for (const folder of parsed.folders) {
        await this.createCategoryFromFolder(
          tenantId,
          folder,
          null,
          categoryMap,
          result,
        );
      }
    }

    // Import all bookmarks
    for (const bookmark of parsed.bookmarks) {
      try {
        // Skip duplicates
        if (options.skipDuplicates && existingUrls.has(bookmark.url)) {
          result.skippedDuplicates++;
          continue;
        }

        // Skip non-http URLs
        if (!bookmark.url.startsWith('http://') && !bookmark.url.startsWith('https://')) {
          continue;
        }

        // Find category for this bookmark
        let categoryId: string | undefined = options.defaultCategoryId;
        // Look up folder-based category
        const parentFolder = this.findParentFolder(parsed.folders, bookmark);
        if (parentFolder && categoryMap.has(parentFolder.name)) {
          categoryId = categoryMap.get(parentFolder.name);
        }

        // Generate favicon URL
        let faviconUrl: string | undefined;
        if (bookmark.icon && bookmark.icon.startsWith('data:')) {
          // Skip data URIs (too large to store)
          try {
            const url = new URL(bookmark.url);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
          } catch {}
        } else {
          try {
            const url = new URL(bookmark.url);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
          } catch {}
        }

        await this.prisma.bookmark.create({
          data: {
            tenantId,
            createdById: userId,
            title: bookmark.title || bookmark.url,
            url: bookmark.url,
            categoryId,
            faviconUrl,
            tags: [],
            status: 'ACTIVE',
          },
        });

        result.importedBookmarks++;
        existingUrls.add(bookmark.url);
      } catch (error: any) {
        result.errors.push(`Failed to import "${bookmark.title}": ${error.message}`);
      }
    }

    return result;
  }

  private async createCategoryFromFolder(
    tenantId: string,
    folder: ParsedFolder,
    parentId: string | null,
    categoryMap: Map<string, string>,
    result: ImportResult,
  ): Promise<void> {
    // Skip common browser default folders
    const skipFolders = ['Bookmarks bar', 'Bookmarks Bar', 'Other bookmarks', 'Other Bookmarks', 'Mobile bookmarks'];

    let currentParentId = parentId;

    if (!skipFolders.includes(folder.name)) {
      // Check if category already exists
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

      categoryMap.set(folder.name, category.id);
      currentParentId = category.id;
    }

    // Process nested folders
    for (const child of folder.children) {
      if ('children' in child) {
        await this.createCategoryFromFolder(
          tenantId,
          child as ParsedFolder,
          currentParentId,
          categoryMap,
          result,
        );
      }
    }
  }

  private findParentFolder(
    folders: ParsedFolder[],
    bookmark: ParsedBookmark,
  ): ParsedFolder | null {
    for (const folder of folders) {
      for (const child of folder.children) {
        if (!('children' in child) && (child as ParsedBookmark).url === bookmark.url) {
          return folder;
        }
      }
      // Check nested
      const nestedFolders = folder.children.filter(c => 'children' in c) as ParsedFolder[];
      const found = this.findParentFolder(nestedFolders, bookmark);
      if (found) return found;
    }
    return null;
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
      data = JSON.parse(jsonContent);
      if (!Array.isArray(data)) {
        data = [data];
      }
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }

    const existingBookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId },
      select: { url: true },
    });
    const existingUrls = new Set(existingBookmarks.map(b => b.url));

    for (const item of data) {
      try {
        const url = item.url || item.href || item.link;
        const title = item.title || item.name || url;

        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) continue;

        if (existingUrls.has(url)) {
          result.skippedDuplicates++;
          continue;
        }

        let faviconUrl: string | undefined;
        try {
          const parsedUrl = new URL(url);
          faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
        } catch {}

        await this.prisma.bookmark.create({
          data: {
            tenantId,
            createdById: userId,
            title,
            url,
            description: item.description || item.desc || null,
            tags: item.tags || [],
            faviconUrl,
            status: 'ACTIVE',
          },
        });

        result.importedBookmarks++;
        existingUrls.add(url);
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

    // Netscape Bookmark HTML format (Chrome / Firefox / Edge compatible)
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
