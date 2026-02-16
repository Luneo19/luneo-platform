import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CopyrightCheckerService } from './copyright-checker.service';

@Module({
  imports: [ConfigModule],
  providers: [CopyrightCheckerService],
  exports: [CopyrightCheckerService],
})
export class LegalModule {}
