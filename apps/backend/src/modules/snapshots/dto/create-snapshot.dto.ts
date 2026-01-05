import { IsString, IsOptional, IsBoolean, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSnapshotDto {
  @ApiProperty({ description: 'Spec hash (SHA256)' })
  @IsString()
  @IsNotEmpty()
  specHash: string;

  @ApiProperty({ description: 'Preview URL (2D)', required: false })
  @IsString()
  @IsOptional()
  previewUrl?: string;

  @ApiProperty({ description: 'Preview 3D URL', required: false })
  @IsString()
  @IsOptional()
  preview3dUrl?: string;

  @ApiProperty({ description: 'Thumbnail URL', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Production bundle URL (ZIP)', required: false })
  @IsString()
  @IsOptional()
  productionBundleUrl?: string;

  @ApiProperty({ description: 'AR model URL (USDZ)', required: false })
  @IsString()
  @IsOptional()
  arModelUrl?: string;

  @ApiProperty({ description: 'GLTF model URL', required: false })
  @IsString()
  @IsOptional()
  gltfModelUrl?: string;

  @ApiProperty({ description: 'Asset versions', required: false })
  @IsObject()
  @IsOptional()
  assetVersions?: any;

  @ApiProperty({ description: 'Is validated', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isValidated?: boolean;

  @ApiProperty({ description: 'Is locked', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiProperty({ description: 'Created by', required: false })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({ description: 'Provenance metadata', required: false })
  @IsObject()
  @IsOptional()
  provenance?: Record<string, any>;
}








