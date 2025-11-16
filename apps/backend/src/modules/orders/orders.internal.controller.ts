import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InternalTokenGuard } from '@/common/guards/internal-token.guard';
import { OrdersService } from './orders.service';

interface InternalCancelPayload {
  reason?: string;
  actorId?: string;
}

@Controller('internal/orders')
@UseGuards(InternalTokenGuard)
export class OrdersInternalController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: InternalCancelPayload) {
    return this.ordersService.cancel(id, undefined, {
      reason: body.reason ?? 'internal_request',
      enforceOwnership: false,
      actorId: body.actorId,
    });
  }
}


