import { Injectable } from '@nestjs/common';
import {
  assertSafeExternalUrl,
  decodeHtmlEntities,
  getDefaultFaviconUrl,
} from '../../common/utils/url.util';

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

    const parsedUrl = await assertSafeExternalUrl(url);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeonBookmarks/1.0)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        result.faviconUrl = getDefaultFaviconUrl(url) || null;
        return result;
      }

      const html = await response.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = decodeHtmlEntities(titleMatch[1]).trim();
      }

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
              result.description = decodeHtmlEntities(content).trim();
            }
            break;
          case 'og:title':
          case 'twitter:title':
            if (content) {
              result.title = decodeHtmlEntities(content).trim();
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
            result.siteName = decodeHtmlEntities(content).trim();
            break;
        }
      }

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

      if (!result.faviconUrl) {
        result.faviconUrl = getDefaultFaviconUrl(url) || null;
      }

      if (result.description && result.description.length > 500) {
        result.description = result.description.substring(0, 497) + '...';
      }
    } catch {
      result.faviconUrl = getDefaultFaviconUrl(url) || null;
    }

    return result;
  }

  private resolveUrl(href: string, base: URL): string {
    if (href.startsWith('//')) return `${base.protocol}${href}`;
    if (href.startsWith('/')) return `${base.origin}${href}`;
    if (href.startsWith('http')) return href;
    return `${base.origin}/${href}`;
  }
}
