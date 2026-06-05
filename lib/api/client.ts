const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'zingzing-access-token';
const REFRESH_TOKEN_KEY = 'zingzing-refresh-token';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  query?: Record<string, unknown>;
  body?: BodyInit | object | null;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

const toQueryString = (query?: Record<string, unknown>): string => {
  if (!query) return '';

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== null && entry !== undefined && entry !== '') {
          params.append(key, String(entry));
        }
      });
      return;
    }

    params.append(key, String(value));
  });

  const stringified = params.toString();
  return stringified ? `?${stringified}` : '';
};

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const getAccessToken = (): string | null => getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
const getRefreshToken = (): string | null => getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  set(accessToken?: string | null, refreshToken?: string | null) {
    const storage = getStorage();
    if (!storage) return;

    if (accessToken) {
      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      storage.removeItem(ACCESS_TOKEN_KEY);
    }

    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
  clear() {
    tokenStorage.set(null, null);
  },
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        tokenStorage.clear();
        return null;
      }

      const payload = (await response.json()) as ApiEnvelope<{ accessToken?: string; refreshToken?: string }>;
      const nextAccessToken = payload?.data?.accessToken;
      const nextRefreshToken = payload?.data?.refreshToken;

      if (!nextAccessToken) {
        tokenStorage.clear();
        return null;
      }

      tokenStorage.set(nextAccessToken, nextRefreshToken ?? refreshToken);
      return nextAccessToken;
    } catch {
      tokenStorage.clear();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const normalizeBody = (body?: RequestOptions['body']): BodyInit | undefined => {
  if (body === null || body === undefined) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  if (typeof body === 'string' || body instanceof Blob || body instanceof URLSearchParams) {
    return body;
  }

  return JSON.stringify(body);
};

const isJsonPayload = (body?: RequestOptions['body']) => {
  if (!body) return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof body === 'string' || body instanceof Blob || body instanceof URLSearchParams) return false;
  return true;
};

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}, allowRetry = true): Promise<T> {
    const {
      method = 'GET',
      query,
      body,
      headers,
      auth = true,
      signal,
    } = options;

    const url = `${API_BASE_URL}${path}${toQueryString(query)}`;
    const accessToken = auth ? getAccessToken() : null;
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(headers || {}),
    };

    if (isJsonPayload(body)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (auth && accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: normalizeBody(body),
      signal,
    });

    if (response.status === 401 && auth && allowRetry) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return this.request<T>(path, options, false);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? (await response.json()) as ApiEnvelope<T> : null;

    if (!response.ok) {
      const message = payload?.error?.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, payload?.error?.details);
    }

    if (!isJson) {
      return undefined as T;
    }

    if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
      return payload.data as T;
    }

    return payload as T;
  },

  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },

  put<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  },

  patch<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  },
};
