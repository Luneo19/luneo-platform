import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../interfaces/rbac.interface';

/**
 * DTO for assigning a role to a user
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'Role to assign',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
