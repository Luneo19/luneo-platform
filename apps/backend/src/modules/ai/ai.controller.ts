import {
  Controller,
  Get,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('quota')
  @ApiOperation({ summary: 'Obtenir le quota IA de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Quota IA',
  })
  async getQuota(@Request() req) {
    // This would return user's AI quota information
    return { message: 'AI quota endpoint' };
  }
}
