import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../interfaces/collaboration.interface';

/** PUT /collaboration/share/:id/permissions */
export class UpdatePermissionsDto {
  @ApiProperty({
    description: 'Permissions per user: { [userId]: Permission[] }',
    example: { 'user-uuid-1': ['view', 'edit', 'comment'], 'user-uuid-2': ['view'] },
  })
  @IsObject()
  permissions: Record<string, Permission[]>;
}
