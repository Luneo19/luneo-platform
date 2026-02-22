import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportStatus } from '@prisma/client';

export class ExportResponseDto {
  @ApiProperty({ description: 'Export job ID' })
  jobId: string;

  @ApiProperty({ description: 'Export status', enum: ExportStatus })
  status: ExportStatus;

  @ApiProperty({
    description: 'Progress (0-100)',
    minimum: 0,
    maximum: 100,
  })
  progress: number;

  @ApiPropertyOptional({ description: 'Download URL when completed' })
  fileUrl?: string | null;

  @ApiPropertyOptional({ description: 'File name' })
  fileName?: string | null;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  errorMessage?: string | null;
}
