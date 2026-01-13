import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@Roles(UserRole.PLATFORM_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Obtenir les métriques de la plateforme' })
  @ApiResponse({
    status: 200,
    description: 'Métriques de la plateforme',
  })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('ai/costs')
  @ApiOperation({ summary: 'Obtenir les coûts IA' })
  @ApiQuery({ name: 'period', required: false, description: 'Période (ex: 30d)' })
  @ApiResponse({
    status: 200,
    description: 'Coûts IA',
  })
  async getAICosts(@Query('period') period: string) {
    return this.adminService.getAICosts(period);
  }

  @Post('ai/blacklist')
  @ApiOperation({ summary: 'Ajouter un terme à la liste noire IA' })
  @ApiResponse({
    status: 201,
    description: 'Terme ajouté à la liste noire',
  })
  async addBlacklistedPrompt(@Body() body: { term: string }) {
    return this.adminService.addBlacklistedPrompt(body.term);
  }

  @Post('customers/bulk-action')
  @ApiOperation({ summary: 'Effectuer une action en masse sur des customers' })
  @ApiResponse({
    status: 200,
    description: 'Action en masse effectuée',
  })
  async bulkActionCustomers(
    @Body() body: {
      customerIds: string[];
      action: 'email' | 'export' | 'tag' | 'segment' | 'delete';
      options?: Record<string, any>;
    },
  ) {
    return this.adminService.bulkActionCustomers(
      body.customerIds,
      body.action,
      body.options,
    );
  }
}
