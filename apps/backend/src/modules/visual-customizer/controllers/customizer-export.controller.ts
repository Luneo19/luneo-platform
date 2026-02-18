import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { CustomizerExportService } from '../services/customizer-export.service';
import { ExportImageDto } from '../dto/export/export-image.dto';
import { ExportPrintDto } from '../dto/export/export-print.dto';

@ApiTags('Visual Customizer - Export')
@Controller('visual-customizer/export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizerExportController {
  constructor(private readonly exportService: CustomizerExportService) {}

  @Post('image')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Export image',
    description: 'Queues an image export job (PNG, JPEG, or WEBP)',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export job queued successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async exportImage(
    @Body(ValidationPipe) dto: ExportImageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.exportService.exportImage(dto, user);
  }

  @Post('pdf')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Export PDF',
    description: 'Queues a PDF export job',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'PDF export job queued successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async exportPDF(
    @Body(ValidationPipe) dto: ExportImageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.exportService.exportPDF(dto, user);
  }

  @Post('print')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Export for print',
    description: 'Queues a print-ready export job (high DPI, CMYK color profile)',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Print export job queued successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async exportPrint(
    @Body(ValidationPipe) dto: ExportPrintDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.exportService.exportPrint(dto, user);
  }

  @Post('svg')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Export SVG',
    description: 'Queues an SVG vector export job',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'SVG export job queued successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async exportSVG(
    @Body(ValidationPipe) dto: ExportImageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.exportService.exportSVG(dto, user);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get export job status',
    description: 'Retrieves the status of an export job',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export job status retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export job not found',
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.exportService.getStatus(jobId, user);
  }

  @Get('jobs/:jobId/download')
  @ApiOperation({
    summary: 'Download exported file',
    description: 'Downloads the exported file once the job is complete',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export job not found or file not ready',
  })
  async downloadFile(
    @Param('jobId') jobId: string,
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fileData = await this.exportService.download(jobId, user);
    
    // Redirect to file URL or fetch and stream the file
    // For now, return the file URL - in production, you might want to stream the file
    res.redirect(fileData.fileUrl);
  }
}
