import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteTeamMemberDto {
  @ApiProperty({ description: 'Email of the person to invite', example: 'collaborator@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiPropertyOptional({ description: 'Role to assign to the invited member' })
  @IsString()
  @IsOptional()
  role?: string;
}
