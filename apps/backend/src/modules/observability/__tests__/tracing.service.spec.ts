/**
 * TracingService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TracingService, Trace } from '../services/tracing.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('TracingService', () => {
  let service: TracingService;
  let prisma: PrismaService;

  const mockPrisma = {
    trace: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSpan', () => {
    it('should return span with traceId, spanId, service, operation', () => {
      const span = service.startSpan('api', 'GET /health');

      expect(span).toHaveProperty('traceId');
      expect(span).toHaveProperty('spanId');
      expect(span.service).toBe('api');
      expect(span.operation).toBe('GET /health');
      expect(span.startTime).toBeInstanceOf(Date);
      expect(span.status).toBe('success');
      expect(span.tags).toEqual({});
      expect(span.logs).toEqual([]);
    });

    it('should use provided traceId and parentSpanId when given', () => {
      const span = service.startSpan('api', 'child', 'trace-123', 'span-parent');

      expect(span.traceId).toBe('trace-123');
      expect(span.parentSpanId).toBe('span-parent');
    });
  });

  describe('finishSpan', () => {
    it('should set endTime, duration and status', () => {
      const span = service.startSpan('api', 'op');
      mockPrisma.trace.create.mockResolvedValue({});

      const finished = service.finishSpan(span, 'success');

      expect(finished.endTime).toBeInstanceOf(Date);
      expect(finished.duration).toBeGreaterThanOrEqual(0);
      expect(finished.status).toBe('success');
      expect(mockPrisma.trace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            traceId: span.traceId,
            spanId: span.spanId,
            operationName: 'op',
            serviceName: 'api',
            status: 'ok',
          }),
        }),
      );
    });

    it('should set error tags and logs when error provided', () => {
      const span = service.startSpan('api', 'op');
      mockPrisma.trace.create.mockResolvedValue({});
      const err = new Error('Test error');

      const finished = service.finishSpan(span, 'error', err);

      expect(finished.status).toBe('error');
      expect(finished.tags?.['error.type']).toBe('Error');
      expect(finished.tags?.['error.message']).toBe('Test error');
      expect(finished.logs?.length).toBe(1);
      expect(finished.logs![0].message).toBe('Test error');
      expect(finished.logs![0].level).toBe('error');
    });
  });

  describe('addTag and addLog', () => {
    it('should add tag to span', () => {
      const span = service.startSpan('api', 'op');

      service.addTag(span, 'http.method', 'GET');

      expect(span.tags).toEqual({ 'http.method': 'GET' });
    });

    it('should add log to span', () => {
      const span = service.startSpan('api', 'op');

      service.addLog(span, 'Processing', 'info');

      expect(span.logs).toHaveLength(1);
      expect(span.logs![0].message).toBe('Processing');
      expect(span.logs![0].level).toBe('info');
    });
  });

  describe('getTrace', () => {
    it('should return spans for traceId', async () => {
      const rows = [
        {
          traceId: 't1',
          spanId: 's1',
          parentSpanId: null,
          operationName: 'op1',
          serviceName: 'api',
          duration: 10,
          status: 'ok',
          metadata: {},
          createdAt: new Date(),
        },
      ];
      mockPrisma.trace.findMany.mockResolvedValue(rows);

      const result = await service.getTrace('t1');

      expect(result).toHaveLength(1);
      expect(result[0].traceId).toBe('t1');
      expect(result[0].operation).toBe('op1');
      expect(mockPrisma.trace.findMany).toHaveBeenCalledWith({
        where: { traceId: 't1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getServiceTraces', () => {
    it('should return traces for service with limit', async () => {
      mockPrisma.trace.findMany.mockResolvedValue([]);

      await service.getServiceTraces('api', 50);

      expect(mockPrisma.trace.findMany).toHaveBeenCalledWith({
        where: { serviceName: 'api' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
