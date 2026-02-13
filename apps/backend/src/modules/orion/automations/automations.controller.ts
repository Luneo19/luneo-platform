import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import type { CreateAutomationDto, UpdateAutomationDto } from './automations.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('orion/automations')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  findAll() {
    return this.automationsService.findAll();
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.automationsService.getStats(id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.automationsService.findById(id);
  }

  @Post()
  create(@Body() body: CreateAutomationDto) {
    return this.automationsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateAutomationDto) {
    return this.automationsService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.automationsService.delete(id);
  }
}
