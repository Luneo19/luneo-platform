import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  @Get('balance')
  async getBalance(@CurrentUserDecorator() user: CurrentUser) {
    return {
      balance: 0,
      used: 0,
      limit: 1000,
      plan: 'free',
    };
  }

  @Get('usage')
  async getUsage(@CurrentUserDecorator() user: CurrentUser) {
    return {
      conversations: 0,
      messages: 0,
      tokens: 0,
      period: 'monthly',
    };
  }
}
