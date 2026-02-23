import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ description: 'Member role' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'Member first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Member last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Member status (active/inactive)' })
  @IsString()
  @IsOptional()
  status?: string;
}
