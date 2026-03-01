import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { BuyCreditsDto } from './dto/buy-credits.dto';
import { CreditsService } from './credits.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  async getBalance(@CurrentUserDecorator() user: CurrentUser) {
    return this.creditsService.getBalance(user.id);
  }

  @Get('usage')
  async getUsage(@CurrentUserDecorator() user: CurrentUser) {
    return this.creditsService.getUsage(user.id);
  }

  @Get('packs')
  async getPacks() {
    return this.creditsService.getPacks();
  }

  @Post('buy')
  async buyCredits(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: BuyCreditsDto,
  ) {
    return this.creditsService.buyCredits(user.id, dto);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit || 20), 1), 100);
    const parsedOffset = Math.max(Number(offset || 0), 0);
    return this.creditsService.getTransactions(user.id, parsedLimit, parsedOffset);
  }
}
