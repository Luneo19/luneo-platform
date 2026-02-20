import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { Prisma } from '@prisma/client';
import { CustomizerSessionsService } from '../services/customizer-sessions.service';
import { CustomizerModerationService } from '../services/customizer-moderation.service';
import { StartSessionDto } from '../dto/sessions/start-session.dto';
import { SaveDesignDto } from '../dto/sessions/save-design.dto';
import { SessionInteractionDto } from '../dto/sessions/session-interaction.dto';
import { CanvasDataValidationPipe } from '../pipes/canvas-data-validation.pipe';

@ApiTags('Visual Customizer - Sessions')
@Controller('visual-customizer')
export class CustomizerSessionsController {
  constructor(
    private readonly sessionsService: CustomizerSessionsService,
    private readonly moderationService: CustomizerModerationService,
  ) {}

  @Post('sessions')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a new session',
    description: 'Creates a new customization session (anonymous or authenticated)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Session created successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found or not published',
  })
  async startSession(
    @Body(ValidationPipe) dto: StartSessionDto,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.sessionsService.start({
      ...dto,
      userId: user?.id,
      anonymousId: user?.id ? undefined : `anon-${Date.now()}-${Math.random()}`,
    });
  }

  @Get('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get session',
    description: 'Retrieves a session by ID (authenticated or anonymous)',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async getSession(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.sessionsService.findOne(id, {
      userId: user?.id,
      anonymousId: undefined,
    });
  }

  @Put('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Update session',
    description: 'Updates session canvas data and metadata',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async updateSession(
    @Param('id') id: string,
    @Body('canvasData', CanvasDataValidationPipe) canvasData: Record<string, unknown>,
    @Body('metadata') metadata?: Record<string, unknown>,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.sessionsService.update(id, { 
      canvasData: canvasData as unknown as Prisma.InputJsonValue,
    }, user!);
  }

  @Post('sessions/:id/interactions')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record interaction',
    description: 'Records a user interaction event (tool usage, layer manipulation, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Interaction recorded successfully',
  })
  async recordInteraction(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: SessionInteractionDto,
  ) {
    return this.sessionsService.recordInteraction(id, dto);
  }

  @Post('sessions/:id/save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save design',
    description: 'Saves the current design state (with moderation check)',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Design saved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Design failed moderation check',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async saveDesign(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: SaveDesignDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    // Check moderation before saving
    const moderationResult = await this.moderationService.checkDesign(dto.canvasData);
    
    if (moderationResult.isBlocked) {
      throw new BadRequestException(
        `Design failed moderation: ${moderationResult.reasons.join(', ') || 'Content not approved'}`,
      );
    }

    return this.sessionsService.saveDesign(id, dto, user);
  }

  @Post('sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete session',
    description: 'Marks a session as completed',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session completed successfully',
  })
  async completeSession(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sessionsService.complete(id, user);
  }

  @Post('sessions/:id/add-to-cart')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add to cart',
    description: 'Adds the customized design to cart and records conversion',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Design added to cart successfully',
  })
  async addToCart(
    @Param('id') id: string,
    @Body('quantity', ValidationPipe) quantity: number = 1,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sessionsService.addToCart(id, quantity, user);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete session',
    description: 'Deletes a session',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Session deleted successfully',
  })
  async deleteSession(
    @Param('id') _id: string,
    @CurrentUser() _user: CurrentUserType,
  ) {
    // Sessions are not deleted, they expire naturally
    return;
  }

  @Get('designs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List saved designs',
    description: 'Get all saved designs for the authenticated user',
  })
  @ApiQuery({
    name: 'customizerId',
    description: 'Filter by customizer ID',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of saved designs retrieved successfully',
  })
  async listDesigns(
    @Query('customizerId') customizerId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserType,
  ) {
    return this.sessionsService.listSavedDesigns(user!, {
      customizerId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('designs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get saved design',
    description: 'Retrieves a single saved design',
  })
  @ApiParam({
    name: 'id',
    description: 'Design UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Design retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Design not found',
  })
  async getDesign(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sessionsService.getSavedDesign(id, user);
  }

  @Get('designs/shared/:token')
  @Public()
  @ApiOperation({
    summary: 'Get shared design',
    description: 'Retrieves a shared design by token (public access)',
  })
  @ApiParam({
    name: 'token',
    description: 'Share token',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shared design retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shared design not found',
  })
  async getSharedDesign(@Param('token') token: string) {
    return this.sessionsService.getSharedDesign(token);
  }

  @Put('designs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update saved design',
    description: 'Updates a saved design',
  })
  @ApiParam({
    name: 'id',
    description: 'Design UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Design updated successfully',
  })
  async updateDesign(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: Partial<SaveDesignDto>,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sessionsService.updateSavedDesign(id, dto, user);
  }

  @Delete('designs/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete saved design',
    description: 'Deletes a saved design',
  })
  @ApiParam({
    name: 'id',
    description: 'Design UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Design deleted successfully',
  })
  async deleteDesign(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.sessionsService.deleteSavedDesign(id, user);
    return;
  }

  @Post('designs/:id/share')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate share link',
    description: 'Generates or regenerates a share link for a saved design',
  })
  @ApiParam({
    name: 'id',
    description: 'Design UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Share link generated successfully',
  })
  async shareDesign(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.sessionsService.generateShareLink(id, 30, user);
  }
}
