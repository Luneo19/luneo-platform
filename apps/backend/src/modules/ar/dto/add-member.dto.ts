import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Member role', enum: ['editor', 'viewer'] })
  @IsEnum(['editor', 'viewer'])
  role: 'editor' | 'viewer';
}


