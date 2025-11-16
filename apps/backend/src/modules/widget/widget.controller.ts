import {
  Controller,
  Get,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WidgetService } from './widget.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Widget')
@Controller('embed')
@UseGuards(ThrottlerGuard)
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  /**
   * GET /api/embed/token
   * Generate short-lived embed JWT token for widget iframe
   */
  @Get('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get embed token for widget',
    description: 'Generates a short-lived JWT token (5 minutes) with a one-time nonce for secure widget embedding. Validates shop installation before issuing token.',
  })
  @ApiQuery({
    name: 'shop',
    description: 'Shop domain (e.g., myshop.myshopify.com)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token for widget authentication' },
        nonce: { type: 'string', description: 'One-time nonce for handshake' },
        expiresIn: { type: 'number', description: 'Token expiry in seconds' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Shop installation not found or inactive',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async getEmbedToken(
    @Query('shop') shop: string,
    @Headers('origin') origin?: string,
  ) {
    if (!shop) {
      throw new BadRequestException('shop parameter is required');
    }

    // Normalize shop domain (remove protocol if present)
    const shopDomain = shop.replace(/^https?:\/\//, '').split('/')[0];

    const tokenData = await this.widgetService.generateEmbedToken(shopDomain, origin);

    return {
      ...tokenData,
      // Include widget URL for convenience (can be overridden by SDK)
      widgetUrl: process.env.WIDGET_CDN_URL || 'https://widget.luneo.app',
    };
  }
}
