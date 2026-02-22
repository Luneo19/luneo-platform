import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType, Permission } from '../interfaces/collaboration.interface';

/** POST /collaboration/share */
export class ShareResourceDto {
  @ApiProperty({ description: 'Resource type', enum: ResourceType })
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({ description: 'User IDs to share with', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  sharedWith: string[];

  @ApiProperty({
    description: 'Permissions per user: { [userId]: Permission[] }',
    example: { 'user-uuid-1': ['view', 'edit'], 'user-uuid-2': ['view'] },
  })
  @IsObject()
  permissions: Record<string, Permission[]>;

  @ApiPropertyOptional({ description: 'Whether the resource is publicly accessible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
