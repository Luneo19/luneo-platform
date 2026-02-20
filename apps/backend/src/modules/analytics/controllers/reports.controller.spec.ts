/**
 * Tests unitaires pour ReportsController
 * TEST-NEW-02: Couverture des endpoints de rapports
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from '../services/reports.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: jest.Mocked<ReportsService>;

  const mockBrand = { id: 'brand-123' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            generatePDFReport: jest.fn(),
            getReportDataForDownload: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getReports', () => {
    it('should throw NotFoundException when brand is null', async () => {
      await expect(controller.getReports(null)).rejects.toThrow(NotFoundException);
    });

    it('should return reports list when brand exists', async () => {
      const result = await controller.getReports(mockBrand);

      expect(result.success).toBe(true);
      expect(result.data.reports).toBeDefined();
      expect(result.data.reports.length).toBeGreaterThan(0);
      expect(result.data.reports[0]).toHaveProperty('id');
      expect(result.data.reports[0]).toHaveProperty('type');
      expect(result.data.reports[0]).toHaveProperty('name');
    });
  });

  describe('generateReport', () => {
    const validBody = {
      type: 'sales' as const,
      dateRange: {
        start: '2026-01-01',
        end: '2026-01-31',
      },
      format: 'pdf' as const,
      includeCharts: true,
    };

    it('should throw NotFoundException when brand is null', async () => {
      await expect(
        controller.generateReport(validBody, null)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when date range is missing', async () => {
      const invalidBody = { ...validBody, dateRange: { start: '', end: '' } };

      await expect(
        controller.generateReport(invalidBody, mockBrand)
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate report with valid parameters', async () => {
      reportsService.generatePDFReport.mockResolvedValue({
        reportId: 'report-123',
        status: 'processing',
      } as unknown);

      const result = await controller.generateReport(validBody, mockBrand);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should accept different formats (csv, json)', async () => {
      const csvBody = { ...validBody, format: 'csv' as const };
      reportsService.generatePDFReport.mockResolvedValue({
        reportId: 'report-csv',
        status: 'processing',
      } as unknown);

      const result = await controller.generateReport(csvBody, mockBrand);

      expect(result.success).toBe(true);
    });
  });

  describe('downloadReport', () => {
    it('should throw NotFoundException when brand is null', async () => {
      await expect(
        controller.downloadReport('550e8400-e29b-41d4-a716-446655440000', undefined, undefined, null)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return report data for valid report', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await controller.downloadReport(reportId, undefined, undefined, mockBrand);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(reportId);
      expect(result.data.type).toBeDefined();
      expect(result.data.period).toBeDefined();
      expect(result.data.report).toBeDefined();
    });
  });
});
