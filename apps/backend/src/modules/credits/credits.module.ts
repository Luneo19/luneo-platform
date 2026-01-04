import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsModule as CreditsLibModule } from '@/libs/credits/credits.module';

@Module({
  imports: [CreditsLibModule],
  controllers: [CreditsController],
})
export class CreditsModule {}









