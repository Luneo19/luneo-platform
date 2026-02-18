/**
 * Configurator 3D API endpoints tests
 * All endpoint functions exist, URLs formed correctly, params passed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const PREFIX = '/api/v1/configurator-3d';

describe('configurator3dEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configurations.list exists and calls GET with correct URL', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await configurator3dEndpoints.configurations.list({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/configurations`, expect.objectContaining({ params: { page: 1, limit: 10 } }));
  });

  it('configurations.get exists and forms URL with id', async () => {
    mockGet.mockResolvedValue({});
    await configurator3dEndpoints.configurations.get('cfg-123');
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-123`, expect.any(Object));
  });

  it('configurations.get passes projectId param', async () => {
    mockGet.mockResolvedValue({});
    await configurator3dEndpoints.configurations.get('cfg-123', { projectId: 'proj-1' });
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-123`, expect.objectContaining({ params: { projectId: 'proj-1' } }));
  });

  it('configurations.getPublic exists and uses public path', async () => {
    mockGet.mockResolvedValue({});
    await configurator3dEndpoints.configurations.getPublic('cfg-456');
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/public/configurations/cfg-456`, expect.any(Object));
  });

  it('configurations.validate exists and POSTs selections', async () => {
    mockPost.mockResolvedValue({ valid: true, errors: [], warnings: [] });
    await configurator3dEndpoints.configurations.validate('cfg-1', { selections: { 'comp-1': 'opt-1' } });
    expect(mockPost).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-1/validate`, { selections: { 'comp-1': 'opt-1' } });
  });

  it('components.list exists and forms URL with configId', async () => {
    mockGet.mockResolvedValue([]);
    await configurator3dEndpoints.components.list('cfg-1');
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-1/components`, expect.any(Object));
  });

  it('rules.list exists and forms URL with configId', async () => {
    mockGet.mockResolvedValue([]);
    await configurator3dEndpoints.rules.list('cfg-1');
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-1/rules`);
  });

  it('sessions.start exists and POSTs StartSessionRequest', async () => {
    mockPost.mockResolvedValue({ id: 's1', sessionId: 's1', configurationId: 'cfg-1', status: 'ACTIVE' });
    await configurator3dEndpoints.sessions.start({ configurationId: 'cfg-1' });
    expect(mockPost).toHaveBeenCalledWith(`${PREFIX}/sessions`, { configurationId: 'cfg-1' });
  });

  it('pricing.calculate exists and POSTs configId and selections', async () => {
    mockPost.mockResolvedValue({ total: 99, basePrice: 99, currency: 'EUR', breakdown: [] });
    await configurator3dEndpoints.pricing.calculate('cfg-1', { selections: {} });
    expect(mockPost).toHaveBeenCalledWith(`${PREFIX}/configurations/cfg-1/calculate-price`, { selections: {} });
  });

  it('export.pdf exists and POSTs sessionId', async () => {
    mockPost.mockResolvedValue({ jobId: 'job-1' });
    await configurator3dEndpoints.export.pdf('session-1');
    expect(mockPost).toHaveBeenCalledWith(`${PREFIX}/sessions/session-1/export/pdf`, {});
  });

  it('savedDesigns.get exists and GETs by id', async () => {
    mockGet.mockResolvedValue({ id: 'design-1', savedAt: '' });
    await configurator3dEndpoints.savedDesigns.get('design-1');
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/saved-designs/design-1`);
  });

  it('analytics.dashboard exists and calls GET', async () => {
    mockGet.mockResolvedValue({});
    await configurator3dEndpoints.analytics.dashboard({ startDate: '2024-01-01', endDate: '2024-12-31' });
    expect(mockGet).toHaveBeenCalledWith(`${PREFIX}/analytics/dashboard`, expect.objectContaining({ params: expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-12-31' }) }));
  });
});
