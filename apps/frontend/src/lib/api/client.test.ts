import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFns = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    isAxiosError: vi.fn((err: unknown) => err != null && typeof err === 'object' && 'response' in err),
    create: () => ({
      ...mockFns,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFns.get.mockResolvedValue({ data: {} });
    mockFns.post.mockResolvedValue({ data: {} });
    mockFns.put.mockResolvedValue({ data: {} });
    mockFns.patch.mockResolvedValue({ data: {} });
    mockFns.delete.mockResolvedValue({ data: {} });
  });

  describe('api.get', () => {
    it('makes GET request and returns data', async () => {
      const { api } = await import('@/lib/api/client');
      mockFns.get.mockResolvedValueOnce({ data: { id: '1', name: 'Test' } });
      const result = await api.get<{ id: string; name: string }>('/api/v1/users/1');
      expect(mockFns.get).toHaveBeenCalledWith('/api/v1/users/1', undefined);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('passes config to GET', async () => {
      const { api } = await import('@/lib/api/client');
      mockFns.get.mockResolvedValueOnce({ data: [] });
      await api.get('/api/v1/products', { params: { page: 1, limit: 10 } });
      expect(mockFns.get).toHaveBeenCalledWith('/api/v1/products', { params: { page: 1, limit: 10 } });
    });
  });

  describe('api.post', () => {
    it('makes POST request with body', async () => {
      const { api } = await import('@/lib/api/client');
      const body = { email: 'a@b.com', password: 'secret' };
      mockFns.post.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
      const result = await api.post<{ user: { id: string } }>('/api/v1/auth/login', body);
      expect(mockFns.post).toHaveBeenCalledWith('/api/v1/auth/login', body, undefined);
      expect(result).toEqual({ user: { id: 'u1' } });
    });
  });

  describe('api.put', () => {
    it('makes PUT request', async () => {
      const { api } = await import('@/lib/api/client');
      mockFns.put.mockResolvedValueOnce({ data: { updated: true } });
      const result = await api.put('/api/v1/orders/ord-1', { status: 'shipped' });
      expect(mockFns.put).toHaveBeenCalledWith('/api/v1/orders/ord-1', { status: 'shipped' }, undefined);
      expect(result).toEqual({ updated: true });
    });
  });

  describe('api.delete', () => {
    it('makes DELETE request', async () => {
      const { api } = await import('@/lib/api/client');
      mockFns.delete.mockResolvedValueOnce({ data: { success: true } });
      const result = await api.delete('/api/v1/designs/des-1');
      expect(mockFns.delete).toHaveBeenCalledWith('/api/v1/designs/des-1', undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('throws on non-200 response (rejected promise)', async () => {
      const { api } = await import('@/lib/api/client');
      const err = new Error('Request failed with status code 404');
      (err as Error & { response?: { status: number } }).response = { status: 404 };
      mockFns.get.mockRejectedValueOnce(err);
      await expect(api.get('/api/v1/not-found')).rejects.toThrow();
    });

    it('throws on network error (client does not retry 4xx)', async () => {
      const { api } = await import('@/lib/api/client');
      const err = new Error('Network Error');
      (err as Error & { response?: { status: number } }).response = { status: 400 };
      mockFns.get.mockRejectedValueOnce(err);
      await expect(api.get('/api/v1/foo')).rejects.toThrow('Network Error');
    });
  });

  describe('token refresh on 401', () => {
    it('rejects on 401 when request fails', async () => {
      const { api } = await import('@/lib/api/client');
      const axiosError = Object.assign(new Error('Request failed with status code 401'), {
        response: { status: 401 },
        config: { url: '/api/v1/orders', method: 'get' },
      });
      mockFns.get.mockRejectedValueOnce(axiosError);
      await expect(api.get('/api/v1/orders')).rejects.toThrow();
    });
  });
});
