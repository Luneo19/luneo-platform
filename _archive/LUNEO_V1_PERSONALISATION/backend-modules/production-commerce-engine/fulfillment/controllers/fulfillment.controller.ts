import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
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
import { FulfillmentService } from '../services/fulfillment.service';
import { TrackingService } from '../services/tracking.service';
import {
  CreateFulfillmentDto,
  ListFulfillmentsQueryDto,
  UpdateFulfillmentStatusDto,
  ShipFulfillmentDto,
} from '../dto/fulfillment.dto';

@ApiTags('PCE - Fulfillment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce/fulfillment')
export class FulfillmentController {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly trackingService: TrackingService,
  ) {}

  @Get()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List fulfillments' })
  async list(
    @CurrentBrand() brand: { id: string },
    @Query() query: ListFulfillmentsQueryDto,
  ) {
    return this.fulfillmentService.listFulfillments(brand.id, {
      status: query.status,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get fulfillment by ID' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async get(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.fulfillmentService.getFulfillment(id, brand.id);
  }

  @Post()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create fulfillment for a pipeline' })
  async create(
    @Body() body: CreateFulfillmentDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.fulfillmentService.createFulfillment(body.pipelineId, brand.id);
  }

  @Put(':id/ship')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Mark fulfillment as shipped' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async ship(
    @Param('id') id: string,
    @Body() body: ShipFulfillmentDto,
    @CurrentBrand() brand: { id: string },
  ) {
    const updated = await this.fulfillmentService.markAsShipped(id, brand.id, {
      carrier: body.carrier,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
      weight: body.weight,
      packages: body.packages,
      estimatedDelivery: body.estimatedDelivery,
    });
    this.trackingService.subscribe(body.trackingNumber, body.carrier);
    return updated;
  }

  @Put(':id/deliver')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Mark fulfillment as delivered' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async deliver(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.fulfillmentService.markAsDelivered(id, brand.id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cancel fulfillment' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async cancel(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.fulfillmentService.cancelFulfillment(id, brand.id);
  }

  @Put(':id/status')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update fulfillment status' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateFulfillmentStatusDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.fulfillmentService.updateFulfillmentStatus(
      id,
      brand.id,
      body.status,
    );
  }

  @Get(':id/tracking')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get tracking status for fulfillment' })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  async getTracking(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    const fulfillment = await this.fulfillmentService.getFulfillment(
      id,
      brand.id,
    );
    const trackingNumber = fulfillment.trackingNumber;
    if (!trackingNumber) {
      return {
        trackingNumber: null,
        carrier: fulfillment.carrier,
        status: fulfillment.status,
        shippedAt: fulfillment.shippedAt,
        deliveredAt: fulfillment.deliveredAt,
        estimatedDelivery: fulfillment.estimatedDelivery,
      };
    }
    const status = await this.trackingService.getStatus(trackingNumber);
    return status ?? {
      trackingNumber,
      carrier: fulfillment.carrier,
      status: fulfillment.status,
      shippedAt: fulfillment.shippedAt,
      deliveredAt: fulfillment.deliveredAt,
      estimatedDelivery: fulfillment.estimatedDelivery,
    };
  }
}
