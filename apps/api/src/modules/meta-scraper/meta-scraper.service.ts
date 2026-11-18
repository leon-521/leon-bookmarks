import { Injectable } from '@nestjs/common';

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  siteName: string | null;
}

@Injectable()
export class MetaScraperService {
  async scrapeUrl(url: string): Promise<UrlMetadata> {
    const result: UrlMetadata = {
      title: null,
      description: null,
      faviconUrl: null,
      ogImageUrl: null,
      siteName: null,
    };

    try {
      const parsedUrl = new URL(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeonBookmarks/1.0; +https://bookmarks.dev)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Still provide favicon fallback
        result.faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
        return result;
      }

      const html = await response.text();

      // Parse title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = this.decodeHtml(titleMatch[1]).trim();
      }

      // Parse meta tags
      const metaTags = html.match(/<meta[^>]+>/gi) || [];
      for (const meta of metaTags) {
        const nameMatch = meta.match(/(?:name|property)=["']([^"']+)["']/i);
        const contentMatch = meta.match(/content=["']([^"']*)["']/i);

        if (!nameMatch || !contentMatch) continue;

        const name = nameMatch[1].toLowerCase();
        const content = contentMatch[1];

        switch (name) {
          case 'description':
          case 'og:description':
          case 'twitter:description':
            if (!result.description) {
              result.description = this.decodeHtml(content).trim();
            }
            break;
          case 'og:title':
          case 'twitter:title':
            if (content) {
              result.title = this.decodeHtml(content).trim();
            }
            break;
          case 'og:image':
          case 'twitter:image':
          case 'twitter:image:src':
            if (!result.ogImageUrl && content) {
              result.ogImageUrl = this.resolveUrl(content, parsedUrl);
            }
            break;
          case 'og:site_name':
            result.siteName = this.decodeHtml(content).trim();
            break;
        }
      }

      // Parse favicon
      const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi);
      if (faviconMatch) {
        for (const link of faviconMatch) {
          const hrefMatch = link.match(/href=["']([^"']+)["']/i);
          if (hrefMatch) {
            result.faviconUrl = this.resolveUrl(hrefMatch[1], parsedUrl);
            break;
          }
        }
      }

      // Fallback favicon
      if (!result.faviconUrl) {
        result.faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
      }

      // Truncate description
      if (result.description && result.description.length > 500) {
        result.description = result.description.substring(0, 497) + '...';
      }

    } catch (error: any) {
      // Provide fallback favicon even on error
      try {
        const parsedUrl = new URL(url);
        result.faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
      } catch {}
    }

    return result;
  }

  private resolveUrl(href: string, base: URL): string {
    if (href.startsWith('//')) return `${base.protocol}${href}`;
    if (href.startsWith('/')) return `${base.origin}${href}`;
    if (href.startsWith('http')) return href;
    return `${base.origin}/${href}`;
  }

  private decodeHtml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
  }
}
