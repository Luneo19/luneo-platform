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
  UseInterceptors,
  ValidationPipe,
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
import { VisualCustomizerService } from '../services/visual-customizer.service';
import { CreateCustomizerDto } from '../dto/configuration/create-customizer.dto';
import { UpdateCustomizerDto } from '../dto/configuration/update-customizer.dto';
import { CustomizerQueryDto } from '../dto/configuration/customizer-query.dto';
import { CustomizerLoggingInterceptor } from '../interceptors/customizer-logging.interceptor';
import { CustomizerPublicAccess } from '../decorators/customizer-permissions.decorator';

@ApiTags('Visual Customizer')
@Controller('visual-customizer')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CustomizerLoggingInterceptor)
export class VisualCustomizerController {
  constructor(private readonly customizerService: VisualCustomizerService) {}

  @Post('customizers')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new customizer',
    description: 'Creates a new visual customizer configuration',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customizer created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) dto: CreateCustomizerDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.create(dto, user);
  }

  @Get('customizers')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List customizers',
    description: 'Get a paginated list of customizers with optional filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of customizers retrieved successfully',
  })
  async list(
    @Query(ValidationPipe) query: CustomizerQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.findAll(user.brandId!, query);
  }

  @Get('customizers/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customizer by ID',
    description: 'Retrieves a single customizer with all its zones and presets',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customizer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.findOne(id, user.brandId!);
  }

  @Get('public/customizers/:id')
  @Public()
  @CustomizerPublicAccess()
  @ApiOperation({
    summary: 'Get public customizer',
    description: 'Retrieves a published public customizer (no authentication required)',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public customizer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Public customizer not found',
  })
  async getPublic(@Param('id') id: string) {
    return this.customizerService.findOnePublic(id);
  }

  @Put('customizers/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update customizer',
    description: 'Updates an existing customizer configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customizer updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateCustomizerDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.update(id, dto, user);
  }

  @Delete('customizers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete customizer',
    description: 'Soft deletes a customizer',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Customizer deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.customizerService.delete(id, user);
    return;
  }

  @Post('customizers/:id/publish')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish customizer',
    description: 'Publishes a customizer, making it available for public use',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customizer published successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.publish(id, user);
  }

  @Post('customizers/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clone customizer',
    description: 'Creates a copy of an existing customizer',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customizer cloned successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async clone(
    @Param('id') id: string,
    @Body(ValidationPipe) body: { name?: string },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.customizerService.clone(id, body.name || `Copy of ${id}`, user);
  }

  @Get('customizers/:id/embed')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get embed code',
    description: 'Generates embed code for the customizer widget',
  })
  @ApiParam({
    name: 'id',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiQuery({
    name: 'width',
    description: 'Widget width',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'height',
    description: 'Widget height',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Embed code generated successfully',
  })
  async getEmbedCode(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Query('width') width?: number,
    @Query('height') height?: number,
  ) {
    return this.customizerService.getEmbedCode(id, { width, height }, user);
  }
}
