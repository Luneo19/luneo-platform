import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: 'Email of the user to invite', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Member role', enum: ['editor', 'viewer'] })
  @IsEnum(['editor', 'viewer'])
  role: 'editor' | 'viewer';
}
