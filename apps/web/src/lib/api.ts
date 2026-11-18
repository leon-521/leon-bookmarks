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
}

class ApiClient {
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
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = (errorBody as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(response.status, message);
    }
    if (response.status === 204) return undefined as T;
    const json = await response.json();
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

  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(path, config?.params), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(path, config?.params), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(path, config?.params), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(path, config?.params), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...config?.headers,
      },
    });
    return this.handleResponse<T>(response);
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
