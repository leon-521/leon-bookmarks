function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured && !configured.includes('localhost')) {
    const clean = configured.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  const internal = (process.env.API_INTERNAL_URL || configured || 'http://localhost:4000')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
  return `${internal}/api`;
}

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  _retried?: boolean;
}

class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const baseUrl = getApiBaseUrl();
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }
    return url.toString();
  }

  private unwrapEnvelope<T>(json: any): T {
    if (
      json &&
      typeof json === 'object' &&
      'data' in json &&
      'meta' in json &&
      json.meta &&
      typeof json.meta === 'object' &&
      !('total' in json.meta)
    ) {
      return json.data as T;
    }
    return json as T;
  }

  private clearAuthAndRedirect() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_tenant');
    const pathname = window.location.pathname;
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/pricing') ||
      pathname.startsWith('/portal');
    if (!isPublicRoute) {
      window.location.href = '/login';
    }
  }

  private async tryRefreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const res = await fetch(this.buildUrl('/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!res.ok) return null;
          const raw = await res.json();
          const tokens = this.unwrapEnvelope<{ accessToken: string; refreshToken: string }>(raw);
          if (tokens?.accessToken) {
            localStorage.setItem('auth_token', tokens.accessToken);
            if (tokens.refreshToken) {
              localStorage.setItem('refresh_token', tokens.refreshToken);
            }
            return tokens.accessToken;
          }
          return null;
        } catch {
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    return this.refreshPromise;
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...this.getAuthHeaders(),
      ...config?.headers,
    };

    const response = await fetch(this.buildUrl(path, config?.params), {
      method,
      headers,
      body:
        data === undefined
          ? undefined
          : isFormData
            ? (data as FormData)
            : JSON.stringify(data),
    });

    if (
      response.status === 401 &&
      !config?._retried &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/register') &&
      !path.startsWith('/auth/refresh')
    ) {
      const newToken = await this.tryRefreshAccessToken();
      if (newToken) {
        return this.request<T>(method, path, data, { ...config, _retried: true });
      }
      this.clearAuthAndRedirect();
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const rawMsg = (errorBody as { message?: string | string[] }).message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(response.status, message);
    }

    if (response.status === 204) return undefined as T;
    const json = await response.json();
    return this.unwrapEnvelope<T>(json);
  }

  get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', path, undefined, config);
  }

  post<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', path, data, config);
  }

  patch<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', path, data, config);
  }

  delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, undefined, config);
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
