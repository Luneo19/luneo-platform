import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CreditsService } from '@/libs/credits/credits.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Credits')
@ApiBearerAuth()
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get user credit balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.creditsService.getBalance(req.user.id);
  }

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add credits to user account (admin/webhook)' })
  @ApiResponse({ status: 200, description: 'Credits added successfully' })
  async addCredits(
    @Body() body: {
      userId: string;
      amount: number;
      packId?: string;
      stripeSessionId?: string;
      stripePaymentId?: string;
    },
  ) {
    return this.creditsService.addCredits(
      body.userId,
      body.amount,
      body.packId,
      body.stripeSessionId,
      body.stripePaymentId,
    );
  }

  @Get('packs')
  @ApiOperation({ summary: 'Get available credit packs' })
  @ApiResponse({ status: 200, description: 'Packs retrieved successfully' })
  async getPacks() {
    return this.creditsService.getAvailablePacks();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.creditsService.getTransactionHistory(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if user has enough credits for endpoint' })
  @ApiResponse({ status: 200, description: 'Check completed' })
  async checkCredits(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: { endpoint: string; amount?: number },
  ) {
    return this.creditsService.checkCredits(req.user.id, body.endpoint, body.amount);
  }
}









