import { IsString, IsArray, IsOptional, IsEnum, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  SVG = 'svg',
  DXF = 'dxf',
  PDF = 'pdf',
}

export enum CompressionType {
  NONE = 'none',
  ZIP = 'zip',
}

export class GenerateExportPackDto {
  @ApiProperty({ description: 'Snapshot ID' })
  @IsString()
  @IsNotEmpty()
  snapshotId: string;

  @ApiProperty({ description: 'Formats to export', enum: ExportFormat, isArray: true, required: false, default: ['svg', 'dxf', 'pdf'] })
  @IsArray()
  @IsOptional()
  formats?: ExportFormat[];

  @ApiProperty({ description: 'Include metadata JSON', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  includeMetadata?: boolean;

  @ApiProperty({ description: 'Compression type', enum: CompressionType, required: false, default: 'zip' })
  @IsEnum(CompressionType)
  @IsOptional()
  compression?: CompressionType;
}








