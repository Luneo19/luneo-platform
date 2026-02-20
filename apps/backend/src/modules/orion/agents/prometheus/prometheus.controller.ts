import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PrometheusService } from './prometheus.service';
import { TicketReviewService } from '../../services/ticket-review.service';
import {
  ReviewQueueQueryDto,
  ApproveResponseDto,
  RejectResponseDto,
  BulkApproveDto,
  SubmitFeedbackDto,
} from '../../dto/prometheus.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('orion-prometheus')
@ApiBearerAuth()
@Controller('orion/prometheus')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class PrometheusController {
  constructor(
    private readonly prometheus: PrometheusService,
    private readonly reviewService: TicketReviewService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get Prometheus AI stats' })
  @ApiResponse({ status: 200, description: 'Prometheus statistics' })
  getStats() {
    return this.prometheus.getStats();
  }

  @Post('tickets/:ticketId/analyze')
  @ApiOperation({ summary: 'Analyze a ticket with AI' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Ticket analysis result' })
  analyzeTicket(@Param('ticketId') ticketId: string) {
    return this.prometheus.analyzeTicket(ticketId);
  }

  @Post('tickets/:ticketId/generate')
  @ApiOperation({ summary: 'Generate AI response for a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Generated AI response' })
  generateResponse(@Param('ticketId') ticketId: string) {
    return this.prometheus.generateResponse(ticketId);
  }

  @Post('tickets/:ticketId/reanalyze')
  @ApiOperation({ summary: 'Re-analyze a ticket with AI' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Re-analysis result' })
  reanalyzeTicket(@Param('ticketId') ticketId: string) {
    return this.prometheus.reanalyzeTicket(ticketId);
  }

  @Get('review-queue')
  @ApiOperation({ summary: 'Get AI response review queue' })
  @ApiResponse({ status: 200, description: 'Review queue entries' })
  getReviewQueue(@Query() query: ReviewQueueQueryDto) {
    return this.reviewService.getReviewQueue({
      status: query.status,
      minConfidence: query.minConfidence,
      maxConfidence: query.maxConfidence,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('review-queue/stats')
  @ApiOperation({ summary: 'Get review queue statistics' })
  @ApiResponse({ status: 200, description: 'Review queue stats' })
  getReviewStats() {
    return this.reviewService.getReviewStats();
  }

  @Post('review-queue/:responseId/approve')
  @ApiOperation({ summary: 'Approve an AI response' })
  @ApiParam({ name: 'responseId', description: 'Response ID' })
  @ApiResponse({ status: 200, description: 'Response approved' })
  approveResponse(
    @Param('responseId') responseId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: ApproveResponseDto,
  ) {
    return this.reviewService.processDecision({
      responseId,
      approved: true,
      reviewerId: req.user.id,
      notes: body.notes,
      editedContent: body.editedContent,
    });
  }

  @Post('review-queue/:responseId/reject')
  @ApiOperation({ summary: 'Reject an AI response' })
  @ApiParam({ name: 'responseId', description: 'Response ID' })
  @ApiResponse({ status: 200, description: 'Response rejected' })
  rejectResponse(
    @Param('responseId') responseId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: RejectResponseDto,
  ) {
    return this.reviewService.processDecision({
      responseId,
      approved: false,
      reviewerId: req.user.id,
      notes: body.notes,
    });
  }

  @Post('review-queue/bulk-approve')
  @ApiOperation({ summary: 'Bulk approve AI responses' })
  @ApiResponse({ status: 200, description: 'Responses approved' })
  bulkApprove(
    @Body() body: BulkApproveDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.bulkApprove(body.responseIds, req.user.id);
  }

  @Put('responses/:responseId/feedback')
  @ApiOperation({ summary: 'Submit feedback on an AI response' })
  @ApiParam({ name: 'responseId', description: 'Response ID' })
  @ApiResponse({ status: 200, description: 'Feedback submitted' })
  submitFeedback(
    @Param('responseId') responseId: string,
    @Body() body: SubmitFeedbackDto,
  ) {
    return this.reviewService.submitFeedback(
      responseId,
      body.rating,
      body.comment,
    );
  }
}
