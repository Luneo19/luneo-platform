import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { RoiService } from './roi.service';

@ApiTags('roi')
@Controller('roi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoiController {
  constructor(private readonly roiService: RoiService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPI ROI mensuel pour organisation courante' })
  async getOverview(@Request() req: RequestWithUser) {
    return { data: await this.roiService.getOverview(req.user) };
  }
}
