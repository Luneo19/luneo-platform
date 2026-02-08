import { Controller, Get, Post, Body, Query, UseGuards, HttpStatus, HttpCode, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OAuthService } from './oauth.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

/**
 * OAuth Controller
 * brandId is read from the authenticated user (JWT); the user must be associated with a brand.
 */
@ApiTags('OAuth')
@Controller('public-api/oauth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('authorize')
  @ApiOperation({ summary: 'Generate OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL generated successfully' })
  @ApiQuery({ name: 'redirect_uri', description: 'Redirect URI after authorization' })
  @ApiQuery({ name: 'scopes', description: 'Requested scopes (comma-separated)', required: false })
  async authorize(
    @Request() req: any,
    @Query('redirect_uri') redirectUri: string,
    @Query('scopes') scopes?: string,
  ) {
    const brandId = this.getBrandIdFromRequest(req);
    const scopeArray = scopes ? scopes.split(',').map(s => s.trim()) : [];
    
    return this.oauthService.generateAuthUrl(brandId, redirectUri, scopeArray);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange authorization code for access token' })
  @ApiResponse({ status: 200, description: 'Token exchanged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid authorization code or state' })
  async token(
    @Body('code') code: string,
    @Body('state') state: string,
  ) {
    return this.oauthService.exchangeCodeForToken(code, state);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refresh token' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.oauthService.refreshAccessToken(refreshToken);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke access token' })
  @ApiResponse({ status: 204, description: 'Token revoked successfully' })
  async revoke(@Body('token') token: string) {
    await this.oauthService.revokeAccessToken(token);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get OAuth client configuration' })
  @ApiResponse({ status: 200, description: 'Client configuration retrieved successfully' })
  async getConfig(@Request() req: any) {
    const brandId = this.getBrandIdFromRequest(req);
    return this.oauthService.getClientConfig(brandId);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  @ApiQuery({ name: 'token', description: 'Access token to validate' })
  async validate(@Query('token') token: string) {
    return this.oauthService.validateAccessToken(token);
  }

  /**
   * API-04: Extrait brandId de l'utilisateur authentifié via JWT
   * L'utilisateur doit être associé à une marque
   */
  private getBrandIdFromRequest(req: any): string {
    const user = req.user;
    if (!user?.brandId) {
      throw new BadRequestException('User is not associated with a brand');
    }
    return user.brandId;
  }
}
