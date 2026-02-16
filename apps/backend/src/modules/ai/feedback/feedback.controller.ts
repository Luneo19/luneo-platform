import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { FeedbackService } from './feedback.service';

@ApiTags('AI Studio - Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio/generations')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post(':generationId/feedback')
  @ApiOperation({ summary: 'Submit feedback for a generation' })
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(
    @Param('generationId') generationId: string,
    @Body()
    body: {
      rating: number;
      feedback?: string;
      issues?: string[];
      wasRegenerated?: boolean;
      isUseful?: boolean;
    },
    @Req() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User ID required');
    return this.feedbackService.create({
      generationId,
      userId,
      ...body,
    });
  }

  @Get(':generationId/feedback')
  @ApiOperation({ summary: 'Get feedback for a generation' })
  async getFeedback(@Param('generationId') generationId: string) {
    return this.feedbackService.getByGeneration(generationId);
  }

  @Delete(':generationId/feedback/:feedbackId')
  @ApiOperation({ summary: 'Delete feedback' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFeedback(
    @Param('feedbackId') feedbackId: string,
    @Req() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User ID required');
    await this.feedbackService.delete(feedbackId, userId);
  }
}
