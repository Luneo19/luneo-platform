import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CustomizerLayersService } from '../services/customizer-layers.service';
import { CreateLayerDto } from '../dto/layers/create-layer.dto';
import { UpdateLayerDto } from '../dto/layers/update-layer.dto';
import { ReorderLayersDto } from '../dto/layers/reorder-layers.dto';

@ApiTags('Visual Customizer - Layers')
@Controller('visual-customizer/zones/:zoneId/layers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomizerLayersController {
  constructor(private readonly layersService: CustomizerLayersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new layer',
    description: 'Creates a new layer within a zone',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Layer created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or maximum layers limit reached',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Zone not found',
  })
  async create(
    @Param('zoneId') zoneId: string,
    @Body(ValidationPipe) dto: CreateLayerDto,
  ) {
    return this.layersService.create(zoneId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List layers',
    description: 'Get all layers for a zone',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of layers retrieved successfully',
  })
  async list(@Param('zoneId') zoneId: string) {
    return this.layersService.findAll(zoneId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get layer by ID',
    description: 'Retrieves a single layer',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Layer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Layer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Layer not found',
  })
  async getOne(
    @Param('zoneId') zoneId: string,
    @Param('id') id: string,
  ) {
    return this.layersService.findOne(zoneId, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update layer',
    description: 'Updates an existing layer configuration',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Layer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Layer updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Layer not found',
  })
  async update(
    @Param('zoneId') zoneId: string,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateLayerDto,
  ) {
    return this.layersService.update(zoneId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete layer',
    description: 'Deletes a layer',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Layer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Layer deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Layer not found',
  })
  async delete(
    @Param('zoneId') zoneId: string,
    @Param('id') id: string,
  ) {
    await this.layersService.delete(zoneId, id);
    return;
  }

  @Post('reorder')
  @ApiOperation({
    summary: 'Reorder layers',
    description: 'Updates the z-index/sort order of layers',
  })
  @ApiParam({
    name: 'zoneId',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Layers reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid layer IDs',
  })
  async reorder(
    @Param('zoneId') zoneId: string,
    @Body(ValidationPipe) dto: ReorderLayersDto,
  ) {
    return this.layersService.reorder(zoneId, dto);
  }
}
