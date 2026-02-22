import { IsString, IsArray, IsIn, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkActionProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @ApiProperty({ enum: ['delete', 'archive', 'activate', 'deactivate'] })
  @IsIn(['delete', 'archive', 'activate', 'deactivate'])
  action: 'delete' | 'archive' | 'activate' | 'deactivate';
}

export class ImportProductsDto {
  @ApiProperty({ description: 'CSV data as string' })
  @IsString()
  csvData: string;
}

export class UploadProductModelDto {
  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsNumber()
  fileSize: number;

  @ApiProperty()
  @IsString()
  fileType: string;
}
