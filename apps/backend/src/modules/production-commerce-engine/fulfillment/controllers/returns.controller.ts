import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { UserRole } from '@prisma/client';
import { ReturnService } from '../services/return.service';
import {
  CreateReturnDto,
  ProcessReturnDto,
  ProcessRefundDto,
  ListReturnsQueryDto,
} from '../dto/return.dto';

@ApiTags('PCE - Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce/returns')
export class ReturnsController {
  constructor(private readonly returnService: ReturnService) {}

  @Get()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List returns' })
  async list(
    @CurrentBrand() brand: { id: string },
    @Query() query: ListReturnsQueryDto,
  ) {
    return this.returnService.listReturns(brand.id, {
      status: query.status,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get return by ID' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  async get(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.returnService.getReturn(id, brand.id);
  }

  @Post()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a return request' })
  async create(
    @Body() body: CreateReturnDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.returnService.createReturn(brand.id, {
      orderId: body.orderId,
      fulfillmentId: body.fulfillmentId,
      reason: body.reason,
      reasonDetails: body.reasonDetails,
      items: body.items,
      notes: body.notes,
      metadata: body.metadata,
    });
  }

  @Put(':id/process')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Process return (approve, reject, etc.)' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  async process(
    @Param('id') id: string,
    @Body() body: ProcessReturnDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.returnService.processReturn(
      id,
      brand.id,
      body.action,
      body.notes,
    );
  }

  @Put(':id/received')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Mark return as received' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  async received(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.returnService.markAsReceived(id, brand.id);
  }

  @Put(':id/refund')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Process refund for return' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  async refund(
    @Param('id') id: string,
    @Body() body: ProcessRefundDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.returnService.processRefund(
      id,
      brand.id,
      body.refundAmountCents,
      body.notes,
    );
  }

  @Get(':id/label')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get return label' })
  @ApiParam({ name: 'id', description: 'Return ID' })
  async getLabel(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    const label = await this.returnService.getReturnLabel(id, brand.id);
    if (label === undefined || label === null) {
      throw new NotFoundException('Return label not available');
    }
    return { returnLabel: label };
  }
}
