import {
  Controller,
  Post,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GDPRService } from '@/modules/security/services/gdpr.service';
import type { Request } from 'express';

/**
 * Controller for GDPR data export and deletion endpoints
 * Implements Right to Access (Article 15) and Right to Erasure (Article 17)
 */
@ApiTags('Data & GDPR')
@Controller('data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DataController {
  constructor(private readonly gdprService: GDPRService) {}

  /**
   * Export user data (GDPR Right to Access)
   * POST /api/data/export?userId=
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export all user data (GDPR Right to Access)',
    description:
      'Exports all personal data associated with a user in a structured format. ' +
      'Users can only export their own data unless they have admin permissions.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID whose data should be exported',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User data exported successfully',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        designs: { type: 'array' },
        orders: { type: 'array' },
        auditLogs: { type: 'array' },
        usageMetrics: { type: 'array' },
        exportedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid userId parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot export other user data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async exportUserData(@Query('userId') userId: string, @Req() req: Request) {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('userId query parameter is required');
    }

    const requestingUser = req.user as { id: string; role?: string };
    
    // Users can only export their own data unless they are admins
    if (requestingUser.id !== userId && requestingUser.role !== 'PLATFORM_ADMIN') {
      throw new NotFoundException('User not found'); // Don't reveal existence of other users
    }

    try {
      const exportData = await this.gdprService.exportUserData(userId);
      return exportData;
    } catch (error) {
      if (error.message === 'User not found') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   * DELETE /api/data/erase?userId=
   */
  @Delete('erase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete all user data (GDPR Right to Erasure)',
    description:
      'Permanently deletes all personal data associated with a user. ' +
      'This action cannot be undone. Users can only delete their own data unless they have admin permissions.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID whose data should be deleted',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User data deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'boolean' },
        itemsDeleted: {
          type: 'object',
          properties: {
            user: { type: 'number' },
            designs: { type: 'number' },
            orders: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid userId parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete other user data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async eraseUserData(
    @Query('userId') userId: string,
    @Req() req: Request,
  ) {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('userId query parameter is required');
    }

    const requestingUser = req.user as { id: string; role?: string };
    
    // Users can only delete their own data unless they are admins
    if (requestingUser.id !== userId && requestingUser.role !== 'PLATFORM_ADMIN') {
      throw new NotFoundException('User not found'); // Don't reveal existence of other users
    }

    try {
      const result = await this.gdprService.deleteUserData(
        userId,
        `GDPR Right to Erasure request by user ${requestingUser.id}`,
      );
      return result;
    } catch (error) {
      if (error.message === 'User not found') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
