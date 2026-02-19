import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from '@/modules/production-commerce-engine/fulfillment/services/shipping.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  SHIPPING_PROVIDER_REGISTRY,
  type IShippingProvider,
  type ShippingRate,
  type GetRatesParams,
  type CreateShipmentParams,
  type CreateShipmentResult,
  type ValidateAddressResult,
  type Address,
} from '@/modules/production-commerce-engine/fulfillment/services/shipping.types';

const mockAddress: Address = {
  line1: '123 Main St',
  city: 'Paris',
  postalCode: '75001',
  country: 'FR',
};
const mockRates: ShippingRate[] = [
  {
    id: 'dhl_express',
    carrier: 'dhl',
    serviceLevel: 'express',
    priceCents: 1200,
    estimatedDaysMin: 2,
    estimatedDaysMax: 4,
    currency: 'EUR',
  },
];
const mockShipmentResult: CreateShipmentResult = {
  shipmentId: 'ship-1',
  trackingNumber: 'TRK123',
  trackingUrl: 'https://track.example/TRK123',
  labelUrl: 'https://label.example/label.pdf',
};
const mockValidateResult: ValidateAddressResult = {
  valid: true,
  normalized: mockAddress,
};

function createMockProvider(carrier: string): IShippingProvider {
  return {
    carrier,
    getRates: jest.fn().mockResolvedValue(mockRates),
    createShipment: jest.fn().mockResolvedValue(mockShipmentResult),
    getLabel: jest.fn().mockResolvedValue({ labelUrl: 'https://label.example/label.pdf' }),
    cancelShipment: jest.fn().mockResolvedValue(undefined),
    validateAddress: jest.fn().mockResolvedValue(mockValidateResult),
  };
}

describe('ShippingService', () => {
  let service: ShippingService;
  let prisma: { shippingRate: { findMany: jest.Mock } };
  let mockProvider: IShippingProvider;

  beforeEach(async () => {
    prisma = {
      shippingRate: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockProvider = createMockProvider('dhl');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SHIPPING_PROVIDER_REGISTRY,
          useValue: [mockProvider],
        },
      ],
    }).compile();

    service = module.get(ShippingService);
  });

  describe('getRates', () => {
    it('should return rates from providers', async () => {
      const params: GetRatesParams = {
        origin: mockAddress,
        destination: mockAddress,
        packages: [{ weightKg: 1 }],
      };

      const result = await service.getRates(params);

      expect(result).toEqual(mockRates);
      expect(mockProvider.getRates).toHaveBeenCalledWith(params);
    });

    it('should filter by carrier when carrier param provided', async () => {
      const params: GetRatesParams = {
        origin: mockAddress,
        destination: mockAddress,
        packages: [{ weightKg: 1 }],
        carrier: 'dhl',
      };

      const result = await service.getRates(params);

      expect(result).toEqual(mockRates);
      expect(mockProvider.getRates).toHaveBeenCalledWith(params);
    });

    it('should return empty array when carrier has no provider', async () => {
      const params: GetRatesParams = {
        origin: mockAddress,
        destination: mockAddress,
        packages: [{ weightKg: 1 }],
        carrier: 'unknown_carrier',
      };

      const result = await service.getRates(params);

      expect(result).toEqual([]);
      expect(mockProvider.getRates).not.toHaveBeenCalled();
    });
  });

  describe('createShipment', () => {
    it('should create shipment via provider', async () => {
      const params: CreateShipmentParams = {
        rateId: 'dhl_express',
        origin: mockAddress,
        destination: mockAddress,
        packages: [{ weightKg: 1 }],
      };

      const result = await service.createShipment(params);

      expect(result).toEqual(mockShipmentResult);
      expect(mockProvider.createShipment).toHaveBeenCalledWith(params);
    });

    it('should throw when rateId has no matching provider', async () => {
      const params: CreateShipmentParams = {
        rateId: 'unknown_express',
        origin: mockAddress,
        destination: mockAddress,
        packages: [{ weightKg: 1 }],
      };

      await expect(service.createShipment(params)).rejects.toThrow('No shipping provider for rate');
    });
  });

  describe('validateAddress', () => {
    it('should validate address via default provider', async () => {
      const result = await service.validateAddress(mockAddress);

      expect(result).toEqual(mockValidateResult);
      expect(mockProvider.validateAddress).toHaveBeenCalledWith(mockAddress);
    });
  });

  describe('getCarriers', () => {
    it('should return list of supported carriers', () => {
      const carriers = service.getCarriers();

      expect(carriers).toContain('dhl');
      expect(carriers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getBrandRates (Prisma)', () => {
    it('should return brand shipping rates from Prisma', async () => {
      const brandRates = [
        {
          id: 'sr-1',
          name: 'Standard',
          carrier: 'dhl',
          serviceLevel: 'standard',
          basePriceCents: 800,
          perKgCents: 100,
          estimatedDaysMin: 3,
          estimatedDaysMax: 5,
          isActive: true,
        },
      ];
      prisma.shippingRate.findMany.mockResolvedValue(brandRates);

      const result = await service.getBrandRates('brand-1');

      expect(result).toEqual(brandRates);
      expect(prisma.shippingRate.findMany).toHaveBeenCalledWith({
        where: { brandId: 'brand-1', isActive: true },
        select: expect.objectContaining({
          id: true,
          name: true,
          carrier: true,
          serviceLevel: true,
          basePriceCents: true,
          perKgCents: true,
          estimatedDaysMin: true,
          estimatedDaysMax: true,
          isActive: true,
        }),
      });
    });
  });
});

describe('ShippingService without providers', () => {
  let service: ShippingService;
  let prisma: { shippingRate: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { shippingRate: { findMany: jest.fn().mockResolvedValue([]) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SHIPPING_PROVIDER_REGISTRY,
          useValue: null,
        },
      ],
    }).compile();

    service = module.get(ShippingService);
  });

  it('getRates should return empty array when no providers', async () => {
    const result = await service.getRates({
      origin: mockAddress,
      destination: mockAddress,
      packages: [{ weightKg: 1 }],
    });
    expect(result).toEqual([]);
  });

  it('validateAddress should return valid: true when no provider', async () => {
    const result = await service.validateAddress(mockAddress);
    expect(result).toEqual({ valid: true, normalized: mockAddress });
  });

  it('getCarriers should return empty array', () => {
    expect(service.getCarriers()).toEqual([]);
  });
});
