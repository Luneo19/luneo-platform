import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { SelectVerticalDto } from './dto/select-vertical.dto';
import { VerticalsService } from './verticals.service';

@ApiTags('verticals')
@Controller('verticals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerticalsController {
  constructor(private readonly verticalsService: VerticalsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Lister les templates verticaux actifs' })
  async listTemplates() {
    return { data: await this.verticalsService.listTemplates() };
  }

  @Get('templates/:slug')
  @ApiOperation({ summary: 'Recuperer un template vertical par slug' })
  async getTemplate(@Param('slug') slug: string) {
    return { data: await this.verticalsService.getTemplate(slug) };
  }

  @Post('select')
  @ApiOperation({ summary: 'Selectionner un template vertical pour l organisation courante' })
  async selectVertical(@Request() req: RequestWithUser, @Body() dto: SelectVerticalDto) {
    return {
      data: await this.verticalsService.selectVerticalForOrganization(
        req.user,
        dto.slug,
        dto.onboardingData,
      ),
    };
  }
}
