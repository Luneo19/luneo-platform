import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PrintfulProvider } from '../providers/printful.provider';

describe('PrintfulProvider', () => {
  let provider: PrintfulProvider;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => (key === 'printful.apiKey' ? 'test-api-key' : undefined)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintfulProvider,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    provider = module.get<PrintfulProvider>(PrintfulProvider);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('printful');
  });

  describe('getProducts', () => {
    it('should return mapped products from Printful API', async () => {
      const apiResponse = {
        code: 200,
        result: [
          {
            id: 1,
            title: 'Unisex Staple T-Shirt',
            type_name: 'T-Shirt',
            image: 'https://example.com/shirt.jpg',
          },
        ],
      };

      (httpService.get as jest.Mock).mockReturnValue(of({ data: apiResponse }));

      const products = await provider.getProducts();

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.printful.com/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('1');
      expect(products[0].name).toBe('Unisex Staple T-Shirt');
      expect(products[0].category).toBeDefined();
    });

    it('should return empty array when API returns non-200 or no result', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of({ data: { code: 400, result: null } }));

      const products = await provider.getProducts();

      expect(products).toEqual([]);
    });

    it('should throw when HTTP request fails', async () => {
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => new Error('Network error')));

      await expect(provider.getProducts()).rejects.toThrow();
    });
  });

  describe('createOrder', () => {
    it('should send correct payload to Printful API', async () => {
      const order = {
        externalId: 'ord-123',
        items: [
          {
            productId: '1',
            variantId: '2',
            quantity: 1,
            designUrl: 'https://cdn.example.com/design.png',
          },
        ],
        shippingAddress: {
          name: 'John Doe',
          address1: '123 Main St',
          address2: '',
          city: 'Paris',
          state: '',
          country: 'FR',
          zip: '75001',
        },
      };

      (httpService.post as jest.Mock).mockReturnValue(
        of({
          data: {
            code: 200,
            result: {
              id: 456,
              status: 'pending',
              created: Math.floor(Date.now() / 1000),
            },
          },
        }),
      );

      const result = await provider.createOrder(order);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.printful.com/orders',
        expect.objectContaining({
          external_id: 'ord-123',
          recipient: expect.objectContaining({
            name: 'John Doe',
            address1: '123 Main St',
            city: 'Paris',
            country_code: 'FR',
            zip: '75001',
          }),
          items: [
            expect.objectContaining({
              variant_id: 2,
              quantity: 1,
              files: [{ url: 'https://cdn.example.com/design.png' }],
            }),
          ],
        }),
        expect.any(Object),
      );
      expect(result.providerOrderId).toBe('456');
      expect(result.status).toBe('pending');
    });

    it('should throw when API key is not configured', async () => {
      (configService.get as jest.Mock).mockReturnValue('');
      const providerNoKey = new PrintfulProvider(httpService as unknown, configService as unknown);

      await expect(providerNoKey.createOrder({ externalId: 'x', items: [], shippingAddress: {} as unknown })).rejects.toThrow(
        'PRINTFUL_API_KEY is not configured',
      );
    });
  });

  describe('getOrderStatus', () => {
    it('should map status correctly from Printful response', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({
          data: {
            code: 200,
            result: {
              id: 456,
              status: 'shipped',
              shipment: {
                tracking_url: 'https://tracking.example/123',
                tracking_number: '1Z999AA10123456784',
              },
            },
          },
        }),
      );

      const result = await provider.getOrderStatus('456');

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.printful.com/orders/456',
        expect.any(Object),
      );
      expect(result.providerOrderId).toBe('456');
      expect(result.status).toBe('shipped');
      expect(result.trackingUrl).toBe('https://tracking.example/123');
    });

    it('should return status without tracking when shipment missing', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({
          data: {
            code: 200,
            result: { id: 456, status: 'inprocess' },
          },
        }),
      );

      const result = await provider.getOrderStatus('456');

      expect(result.status).toBe('inprocess');
      expect(result.trackingUrl).toBeUndefined();
    });
  });
});
