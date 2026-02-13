/**
 * OAuth Controller
 * Endpoints for managing OAuth accounts
 */

import {
  Controller,
  Get,
  Delete,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthService } from '../services/oauth.service';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('OAuth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('providers')
  @ApiOperation({
    summary: 'Get available OAuth providers',
    description: 'Returns list of configured OAuth providers (Google, GitHub)',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth providers retrieved successfully',
  })
  async getProviders() {
    const config = this.oauthService.getOAuthConfig();
    return {
      success: true,
      data: {
        google: config.google ? { enabled: true } : { enabled: false },
        github: config.github ? { enabled: true } : { enabled: false },
      },
    };
  }

  @Get('accounts')
  @ApiOperation({
    summary: 'Get linked OAuth accounts',
    description: 'Returns list of OAuth accounts linked to the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Linked accounts retrieved successfully',
  })
  async getLinkedAccounts(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const accounts = await this.oauthService.getLinkedAccounts(req.user.id);
    return {
      success: true,
      data: accounts,
    };
  }

  @Delete('accounts/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink OAuth account',
    description: 'Unlinks an OAuth account from the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth account unlinked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'OAuth account not found',
  })
  async unlinkAccount(@Request() req: ExpressRequest & { user: CurrentUser }, @Param('provider') provider: string) {
    const result = await this.oauthService.unlinkOAuthAccount(req.user.id, provider);
    return {
      success: true,
      message: `OAuth account ${provider} unlinked successfully`,
      data: result,
    };
  }
}
