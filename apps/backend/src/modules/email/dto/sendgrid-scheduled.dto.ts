import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGridScheduledDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'HTML content of the email' })
  @IsString()
  @IsNotEmpty()
  html: string;

  @ApiProperty({ description: 'ISO date string when to send the email' })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  sendAt: string;
}
