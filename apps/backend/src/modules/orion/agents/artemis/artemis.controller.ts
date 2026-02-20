import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ArtemisService } from './artemis.service';
import { BlockIPDto } from '../../dto/artemis.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('orion-artemis')
@ApiBearerAuth()
@Controller('orion/artemis')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class ArtemisController {
  constructor(private readonly artemis: ArtemisService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Artemis security dashboard' })
  @ApiResponse({ status: 200, description: 'Security dashboard data' })
  getDashboard() {
    return this.artemis.getDashboard();
  }

  @Get('threats')
  @ApiOperation({ summary: 'Get active security threats' })
  @ApiResponse({ status: 200, description: 'Active threats list' })
  getThreats() {
    return this.artemis.getActiveThreats();
  }

  @Post('threats/:id/resolve')
  @ApiOperation({ summary: 'Resolve a security threat' })
  @ApiParam({ name: 'id', description: 'Threat ID' })
  @ApiResponse({ status: 200, description: 'Threat resolved' })
  resolveThreat(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.artemis.resolveThreat(id, req.user.id);
  }

  @Get('blocked-ips')
  @ApiOperation({ summary: 'Get list of blocked IPs' })
  @ApiResponse({ status: 200, description: 'Blocked IPs list' })
  getBlockedIPs() {
    return this.artemis.getBlockedIPs();
  }

  @Post('block-ip')
  @ApiOperation({ summary: 'Block an IP address' })
  @ApiResponse({ status: 201, description: 'IP blocked' })
  blockIP(@Body() body: BlockIPDto, @Req() req: AuthenticatedRequest) {
    return this.artemis.blockIP(
      body.ipAddress,
      body.reason,
      req.user.id,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
      body.brandId,
    );
  }

  @Delete('blocked-ips/:ip')
  @ApiOperation({ summary: 'Unblock an IP address' })
  @ApiParam({ name: 'ip', description: 'IP address to unblock' })
  @ApiResponse({ status: 200, description: 'IP unblocked' })
  unblockIP(@Param('ip') ip: string) {
    return this.artemis.unblockIP(ip);
  }

  @Get('fraud-checks')
  @ApiOperation({ summary: 'Get recent fraud checks' })
  @ApiResponse({ status: 200, description: 'Fraud checks list' })
  getFraudChecks() {
    return this.artemis.getFraudChecks();
  }
}
