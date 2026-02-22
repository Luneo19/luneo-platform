import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowVoiceChat?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowAnnotations?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowModelEditing?: boolean;
}

export class JoinRoomDto {
  @ApiProperty({ example: 'web' })
  @IsString()
  platform: string;

  @ApiProperty({ required: false, default: 'viewer' })
  @IsString()
  @IsOptional()
  role?: string;
}

export class ShareAnchorDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  position?: { x: number; y: number; z: number };

  @ApiProperty({ required: false })
  @IsOptional()
  rotation?: { x: number; y: number; z: number };

  @ApiProperty({ required: false })
  @IsOptional()
  scale?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
