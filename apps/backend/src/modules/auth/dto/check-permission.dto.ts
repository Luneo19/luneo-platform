import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '@/modules/security/interfaces/rbac.interface';

export class CheckPermissionDto {
  @ApiProperty({
    description: 'Permission to check',
    example: Permission.ORDER_READ,
    enum: Permission,
  })
  @IsString()
  @IsNotEmpty({ message: 'Permission is required' })
  @IsEnum(Permission, { message: 'Permission must be a valid permission value' })
  permission: string;

  @ApiPropertyOptional({ description: 'Resource type (optional context)' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ description: 'Resource ID (optional context)' })
  @IsString()
  @IsOptional()
  resourceId?: string;
}
