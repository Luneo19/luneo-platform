import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  IsBoolean,
  IsIn,
} from 'class-validator';

const RENDER_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

type Priority = (typeof RENDER_PRIORITIES)[number];

type RenderFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg';

type ExportFormat = 'gltf' | 'glb' | 'usdz' | 'obj' | 'fbx';

type RenderQuality = 'draft' | 'standard' | 'high' | 'ultra';

type CameraType = 'perspective' | 'orthographic';

type RenderType = '2d' | '3d';

class CameraSettingsDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  z!: number;
}

class LightingSettingsDto {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  intensity?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CameraSettingsDto)
  directional?: CameraSettingsDto[];
}

export class RenderOptionsDto {
  @IsNumber()
  @Min(1)
  @Max(8192)
  width!: number;

  @IsNumber()
  @Min(1)
  @Max(8192)
  height!: number;

  @IsOptional()
  @Min(48)
  @Max(600)
  dpi?: number;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsIn(['draft', 'standard', 'high', 'ultra'], { message: 'quality must be draft|standard|high|ultra' })
  quality?: RenderQuality;

  @IsOptional()
  @IsBoolean()
  antialiasing?: boolean;

  @IsOptional()
  @IsBoolean()
  shadows?: boolean;

  @IsOptional()
  @IsBoolean()
  reflections?: boolean;

  @IsOptional()
  @IsIn(['png', 'jpg', 'jpeg', 'webp', 'svg'], { message: 'format must be png|jpg|jpeg|webp|svg' })
  format?: RenderFormat;

  @IsOptional()
  @IsNumber()
  compression?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CameraSettingsDto)
  camera?: {
    position: CameraSettingsDto;
    target: CameraSettingsDto;
    fov?: number;
    near?: number;
    far?: number;
    type?: CameraType;
  };

  @IsOptional()
  @ValidateNested()
  @Type(() => LightingSettingsDto)
  lighting?: LightingSettingsDto;

  @IsOptional()
  @IsIn(['gltf', 'glb', 'usdz', 'obj', 'fbx'], { message: 'exportFormat must be gltf|glb|usdz|obj|fbx' })
  exportFormat?: ExportFormat;

  @IsOptional()
  @IsBoolean()
  optimizeForWeb?: boolean;

  @IsOptional()
  @IsBoolean()
  includeAnimations?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateRenderDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsIn(['2d', '3d'], { message: 'type must be 2d or 3d' })
  type?: RenderType;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsOptional()
  @IsString()
  designId?: string;

  @ValidateNested()
  @Type(() => RenderOptionsDto)
  options!: RenderOptionsDto;

  @IsOptional()
  @IsIn(RENDER_PRIORITIES, { message: 'priority must be low|normal|high|urgent' })
  priority?: Priority;

  @IsOptional()
  @IsString()
  callback?: string;

  @IsString()
  brandId!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
