import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum ContactType {
  GENERAL = 'general',
  SUPPORT = 'support',
  ENTERPRISE = 'enterprise',
  ENTERPRISE_PRICING = 'enterprise_pricing',
  PARTNERSHIP = 'partnership',
}

export class ContactRequestDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Luneo SAS', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ApiProperty({ example: 'Question sur les plans' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: 'Bonjour, je souhaite en savoir plus sur votre offre Enterprise.' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ enum: ContactType, required: false, default: ContactType.GENERAL })
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @ApiProperty({ required: false, description: 'reCAPTCHA v3 token' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  captchaToken?: string;
}
