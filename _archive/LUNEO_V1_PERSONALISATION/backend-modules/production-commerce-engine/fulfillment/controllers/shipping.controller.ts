import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { UserRole } from '@prisma/client';
import { ShippingService } from '../services/shipping.service';
import { GetRatesDto, ValidateAddressDto } from '../dto/shipping.dto';

@ApiTags('PCE - Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rates')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get shipping rates for origin/destination/packages' })
  async getRates(
    @Body() body: GetRatesDto,
    @CurrentBrand() brand: { id: string },
  ) {
    const rates = await this.shippingService.getRates({
      origin: body.origin,
      destination: body.destination,
      packages: body.packages,
      carrier: body.carrier,
    });
    const brandRates = await this.shippingService.getBrandRates(brand.id);
    return {
      rates,
      brandRates,
    };
  }

  @Post('validate-address')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Validate an address' })
  async validateAddress(@Body() body: ValidateAddressDto) {
    return this.shippingService.validateAddress(body.address);
  }

  @Get('carriers')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List configured shipping carriers' })
  async getCarriers() {
    const carriers = this.shippingService.getCarriers();
    return { carriers };
  }
}
