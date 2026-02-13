import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('orion/communications')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('templates')
  getTemplates(
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.communicationsService.getTemplates({
      category,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.communicationsService.getTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() body: CreateTemplateDto) {
    return this.communicationsService.createTemplate(body);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: UpdateTemplateDto) {
    return this.communicationsService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id);
  }

  @Get('logs')
  getLogs(
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.communicationsService.getCommunicationLogs({
      type,
      userId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.communicationsService.getStats();
  }
}
