import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère les statistiques de parrainage de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques de parrainage' })
  async getStats(@Request() req: { user: CurrentUser }) {
    return this.referralService.getStats(req.user.id);
  }

  @Post('join')
  @Public()
  @ApiOperation({ summary: 'Inscription au programme d\'affiliation' })
  @ApiResponse({ status: 200, description: 'Demande envoyée avec succès' })
  async join(@Body() body: { email: string }) {
    return this.referralService.join(body.email);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demande de retrait des commissions' })
  @ApiResponse({ status: 200, description: 'Demande de retrait enregistrée' })
  async withdraw(@Request() req: { user: CurrentUser }) {
    return this.referralService.withdraw(req.user.id);
  }
}
