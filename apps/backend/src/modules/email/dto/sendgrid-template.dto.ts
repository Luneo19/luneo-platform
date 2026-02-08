import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendGridTemplateDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'SendGrid template ID' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ description: 'Template data (key-value for template variables)' })
  @IsObject()
  templateData: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Email subject override' })
  @IsOptional()
  @IsString()
  subject?: string;
}
