import { Module } from '@nestjs/common';
import { QueuesModule } from '@/libs/queues/queues.module';
import { IntegrationsApiController } from './integrations-api.controller';
import { IntegrationsApiService } from './integrations-api.service';

@Module({
  imports: [QueuesModule],
  controllers: [IntegrationsApiController],
  providers: [IntegrationsApiService],
})
export class IntegrationsApiModule {}
