import { BadRequestException } from '@nestjs/common';
import { promises as dns } from 'dns';
import * as net from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'postgres',
  'redis',
  'minio',
  'meilisearch',
  'api',
  'web',
  'metadata.google.internal',
]);

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // Link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // Multicast / reserved
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
    if (normalized.startsWith('fe80')) return true; // Link-local
    if (normalized.startsWith('::ffff:')) {
      const v4 = normalized.slice('::ffff:'.length);
      if (net.isIPv4(v4)) return isPrivateOrReservedIp(v4);
    }
    return false;
  }

  return true;
}

/**
 * Validates that a URL uses http/https and does not resolve to loopback,
 * RFC1918 private networks, link-local metadata endpoints, or internal Docker hosts.
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Only http and https URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new BadRequestException('Target host is not allowed');
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new BadRequestException('Private or loopback IP addresses are not allowed');
    }
    return parsed;
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length || records.some((r) => isPrivateOrReservedIp(r.address))) {
      throw new BadRequestException('Target host resolves to a restricted network address');
    }
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException('Unable to resolve target hostname');
  }

  return parsed;
}

/**
 * Generates a direct site favicon URL without relying on blocked third-party services.
 */
export function getDefaultFaviconUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return `${parsed.origin}/favicon.ico`;
  } catch {
    return undefined;
  }
}

/**
 * Decodes standard HTML entities in scraped titles/descriptions and bookmark exports.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
}

/**
 * Masks an API key, preserving only the last 4 characters.
 */
export function maskApiKey(apiKey?: string | null): string {
  if (!apiKey) return '';
  if (apiKey.length <= 4) return '****';
  return `${'*'.repeat(Math.min(24, apiKey.length - 4))}${apiKey.slice(-4)}`;
}
