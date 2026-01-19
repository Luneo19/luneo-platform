import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-admin')
  @Public()
  @ApiOperation({ summary: 'Créer l\'admin (endpoint de setup - sécurisé avec clé secrète)' })
  @ApiHeader({ name: 'X-Setup-Key', description: 'Clé secrète pour créer l\'admin' })
  @ApiResponse({ status: 201, description: 'Admin créé avec succès' })
  @ApiResponse({ status: 401, description: 'Clé secrète invalide' })
  async createAdmin(@Headers('x-setup-key') setupKey: string) {
    // Vérifier la clé secrète (utiliser une variable d'environnement ou une clé fixe pour le setup)
    const validKey = process.env.SETUP_SECRET_KEY || 'luneo-setup-2024-secret-key-change-in-production';
    
    if (!setupKey || setupKey !== validKey) {
      throw new UnauthorizedException('Invalid setup key');
    }

    return this.adminService.createAdminUser();
  }

  @Get('metrics')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtenir les métriques de la plateforme' })
  @ApiResponse({
    status: 200,
    description: 'Métriques de la plateforme',
  })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('ai/costs')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
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
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Ajouter un terme à la liste noire IA' })
  @ApiResponse({
    status: 201,
    description: 'Terme ajouté à la liste noire',
  })
  async addBlacklistedPrompt(@Body() body: { term: string }) {
    return this.adminService.addBlacklistedPrompt(body.term);
  }

  @Post('customers/bulk-action')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
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
