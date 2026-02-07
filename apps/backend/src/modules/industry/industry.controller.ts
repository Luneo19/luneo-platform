import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IndustryService } from './industry.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/guards/roles.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('industries')
@Controller('industries')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @Get()
  /** @Public: industry list for landing/configurator */
  @Public()
  @ApiOperation({ summary: 'List all active industries' })
  async list() {
    return this.industryService.getAll();
  }

  @Get(':slug/config')
  /** @Public: industry config for configurator */
  @Public()
  @ApiOperation({ summary: 'Get industry configuration only' })
  async getConfig(@Param('slug') slug: string) {
    return this.industryService.getConfig(slug);
  }

  @Get(':slug')
  /** @Public: industry by slug for public pages */
  @Public()
  @ApiOperation({ summary: 'Get industry by slug with full config' })
  async getBySlug(@Param('slug') slug: string) {
    return this.industryService.getBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create industry (admin only)' })
  async create(@Body() dto: CreateIndustryDto) {
    return this.industryService.create(dto);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update industry (admin only)' })
  async update(@Param('slug') slug: string, @Body() dto: UpdateIndustryDto) {
    return this.industryService.update(slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete industry (admin only)' })
  async delete(@Param('slug') slug: string) {
    return this.industryService.delete(slug);
  }
}
