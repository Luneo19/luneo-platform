import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Railway Health Controller
 * 
 * This controller provides a simple health check endpoint at /health
 * that Railway can use for health checks. It's excluded from the global
 * prefix to be accessible at /health (not /api/v1/health).
 * 
 * This is a minimal implementation that doesn't depend on Terminus
 * to ensure it works reliably with Railway's health check system.
 */
@ApiTags('Health')
@Controller('health') // Direct path 'health' - will be /health when excluded from global prefix
export class RailwayHealthController {
  @Get() // Empty path - will be /health when controller path is 'health'
  @Public() // Make health endpoint public (no authentication required)
  @ApiOperation({ 
    summary: 'Health check endpoint for Railway',
    description: 'Simple health check endpoint that returns the service status. Used by Railway for health checks.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Uptime in seconds' },
        service: { type: 'string', example: 'luneo-backend' },
        version: { type: 'string', example: '1.0.0' },
      }
    }
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'luneo-backend',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}

