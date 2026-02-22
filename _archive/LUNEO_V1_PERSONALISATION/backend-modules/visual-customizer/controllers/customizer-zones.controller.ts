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
import { CustomizerOwnerGuard } from '../guards/customizer-owner.guard';
import { CustomizerZonesService } from '../services/customizer-zones.service';
import { CreateZoneDto } from '../dto/zones/create-zone.dto';
import { UpdateZoneDto } from '../dto/zones/update-zone.dto';
import { ReorderZonesDto } from '../dto/zones/reorder-zones.dto';

@ApiTags('Visual Customizer - Zones')
@Controller('visual-customizer/customizers/:customizerId/zones')
@UseGuards(JwtAuthGuard, CustomizerOwnerGuard)
@ApiBearerAuth()
export class CustomizerZonesController {
  constructor(private readonly zonesService: CustomizerZonesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new zone',
    description: 'Creates a new customization zone within a customizer',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Zone created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or maximum zones limit reached',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customizer not found',
  })
  async create(
    @Param('customizerId') customizerId: string,
    @Body(ValidationPipe) dto: CreateZoneDto,
  ) {
    return this.zonesService.create(customizerId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List zones',
    description: 'Get all zones for a customizer',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of zones retrieved successfully',
  })
  async list(@Param('customizerId') customizerId: string) {
    return this.zonesService.findAll(customizerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get zone by ID',
    description: 'Retrieves a single zone with its layers',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zone retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Zone not found',
  })
  async getOne(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
  ) {
    return this.zonesService.findOne(customizerId, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update zone',
    description: 'Updates an existing zone configuration',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zone updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Zone not found',
  })
  async update(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(customizerId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete zone',
    description: 'Deletes a zone and all its layers',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'Zone UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Zone deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Zone not found',
  })
  async delete(
    @Param('customizerId') customizerId: string,
    @Param('id') id: string,
  ) {
    await this.zonesService.delete(customizerId, id);
    return;
  }

  @Post('reorder')
  @ApiOperation({
    summary: 'Reorder zones',
    description: 'Updates the sort order of zones',
  })
  @ApiParam({
    name: 'customizerId',
    description: 'Customizer UUID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Zones reordered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid zone IDs',
  })
  async reorder(
    @Param('customizerId') customizerId: string,
    @Body(ValidationPipe) dto: ReorderZonesDto,
  ) {
    return this.zonesService.reorder(customizerId, dto);
  }
}
