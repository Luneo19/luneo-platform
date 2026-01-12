import { Controller, Get, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AnalyticsExportService } from '../services/export.service';

@ApiTags('Analytics Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics/export')
export class AnalyticsExportController {
  constructor(private readonly exportService: AnalyticsExportService) {}

  @Get('pdf')
  @ApiOperation({
    summary: 'Export analytics to PDF',
    description: 'Export analytics data to PDF format with charts and statistics',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'includeCharts', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'PDF file downloaded' })
  async exportPDF(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCharts') includeCharts?: boolean,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    if (!res) {
      throw new Error('Response object required');
    }

    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('Brand ID required');
    }

    await this.exportService.exportToPDF(
      {
        format: 'pdf',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        brandId,
        includeCharts: includeCharts === true,
      },
      res,
    );
  }

  @Get('excel')
  @ApiOperation({
    summary: 'Export analytics to Excel',
    description: 'Export analytics data to Excel format with multiple sheets',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Excel file downloaded' })
  async exportExcel(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    if (!res) {
      throw new Error('Response object required');
    }

    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('Brand ID required');
    }

    await this.exportService.exportToExcel(
      {
        format: 'excel',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        brandId,
      },
      res,
    );
  }

  @Get('csv')
  @ApiOperation({
    summary: 'Export analytics to CSV',
    description: 'Export analytics data to CSV format',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportCSV(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    if (!res) {
      throw new Error('Response object required');
    }

    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('Brand ID required');
    }

    await this.exportService.exportToCSV(
      {
        format: 'csv',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        brandId,
      },
      res,
    );
  }
}
