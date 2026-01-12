import { ApiProperty } from '@nestjs/swagger';

export class Setup2FADto {
  @ApiProperty({ example: '123456', description: 'Code TOTP à 6 chiffres' })
  token?: string;
}
