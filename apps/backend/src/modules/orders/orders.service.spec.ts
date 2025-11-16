import Stripe from 'stripe';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

const prismaMock = {
  design: {
    findUnique: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
} as unknown as {
  design: {
    findUnique: jest.Mock;
  };
  order: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

const productionQueueMock = {
  enqueueCreateBundle: jest.fn(),
};

const configServiceMock = {
  get: jest.fn(),
};

const buildService = () => {
  const service = new OrdersService(
    prismaMock as unknown as any,
    configServiceMock as unknown as any,
    productionQueueMock as unknown as any,
  );
  (service as unknown as { stripe: unknown }).stripe = {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  } as unknown;
  return service;
};

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'stripe.secretKey') {
        return 'sk_test_123';
      }
      if (key === 'app.frontendUrl') {
        return 'https://app.luneo.dev';
      }
      return undefined;
    });
  });

  it('lève une erreur si la clé Stripe est absente', () => {
    const configMissing = {
      get: jest.fn(() => undefined),
    };

    expect(
      () => new OrdersService(prismaMock as unknown as any, configMissing as unknown as any, productionQueueMock as unknown as any),
    ).toThrow('Stripe secret key is not configured');
  });

  describe('create', () => {
    it('rejette si le design est introuvable', async () => {
      const service = buildService();
      prismaMock.design.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            designId: 'missing',
            customerEmail: 'client@example.com',
            shippingAddress: {
              firstName: 'Test',
              lastName: 'User',
              address1: '1 rue',
              city: 'Paris',
              postalCode: '75001',
              country: 'FR',
            },
          } as unknown as any,
          { id: 'user_1', role: UserRole.PLATFORM_ADMIN },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejette si la marque ne correspond pas', async () => {
      const service = buildService();
      prismaMock.design.findUnique.mockResolvedValue({
        id: 'design_1',
        brandId: 'brand_other',
        productId: 'product_1',
        prompt: 'Design',
        product: {
          name: 'Produit',
          price: { toString: () => '100' },
        },
        brand: { id: 'brand_other' },
      });

      await expect(
        service.create(
          {
            designId: 'design_1',
            customerEmail: 'client@example.com',
            shippingAddress: {
              firstName: 'Test',
              lastName: 'User',
              address1: '1 rue',
              city: 'Paris',
              postalCode: '75001',
              country: 'FR',
            },
          } as unknown as any,
          { id: 'user_1', role: UserRole.BRAND_ADMIN, brandId: 'brand_1' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('gère les quantités en chaîne et adresse minimale', async () => {
      const service = buildService();
      const fakeDesign = {
        id: 'design_2',
        brandId: 'brand_1',
        productId: 'product_1',
        prompt: 'Prompt',
        product: {
          name: 'Produit',
          price: { toString: () => '50' },
        },
        brand: { id: 'brand_1' },
      };
      prismaMock.design.findUnique.mockResolvedValue(fakeDesign);
      prismaMock.order.create.mockResolvedValue({
        id: 'order_2',
        brandId: 'brand_1',
        designId: 'design_2',
        productId: 'product_1',
      });
      prismaMock.order.update.mockResolvedValue({});

      const stripeCreate = (service as unknown as { stripe: { checkout: { sessions: { create: jest.Mock } } } })
        .stripe.checkout.sessions.create;
      stripeCreate.mockResolvedValue({
        id: 'cs_test_2',
        url: 'https://stripe.test/session/cs_test_2',
      });

      await service.create(
        {
          designId: 'design_2',
          customerEmail: 'client@example.com',
          quantity: '2',
          shippingAddress: {
            firstName: 'Anna',
            lastName: 'Smith',
            address1: '5 avenue',
            city: 'Lyon',
            postalCode: '69000',
            country: 'FR',
          },
        } as unknown as any,
        { id: 'user_2', role: UserRole.BRAND_ADMIN, brandId: 'brand_1' },
      );

      const { data } = prismaMock.order.create.mock.calls[0][0];
      expect(data.metadata).toEqual({ quantity: 2, unitPriceCents: 5000 });
      expect(data.shippingAddress).toEqual({
        firstName: 'Anna',
        lastName: 'Smith',
        company: undefined,
        address1: '5 avenue',
        address2: undefined,
        city: 'Lyon',
        state: '',
        postalCode: '69000',
        country: 'FR',
        phone: '',
      });
    });

    it('crée une commande Stripe avec quantité et adresse normalisées', async () => {
      const service = buildService();
      const fakeDesign = {
        id: 'design_1',
        brandId: 'brand_1',
        productId: 'product_1',
        prompt: 'Custom prompt',
        product: {
          name: 'Produit Premium',
          price: { toString: () => '199.90' },
        },
        brand: { id: 'brand_1' },
      };

      prismaMock.design.findUnique.mockResolvedValue(fakeDesign);

      const fakeOrder = {
        id: 'order_1',
        brandId: 'brand_1',
        designId: 'design_1',
        productId: 'product_1',
      };

      prismaMock.order.create.mockResolvedValue({
        ...fakeOrder,
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Doe',
          address1: '10 Rue de Paris',
          city: 'Paris',
          state: '',
          postalCode: '75001',
          country: 'FR',
          phone: '',
        },
      });
      prismaMock.order.update.mockResolvedValue({});

      const stripeCreate = (service as unknown as { stripe: { checkout: { sessions: { create: jest.Mock } } } })
        .stripe.checkout.sessions.create;
      stripeCreate.mockResolvedValue({
        id: 'cs_test_1',
        url: 'https://stripe.test/session/cs_test_1',
      });

      const result = await service.create(
        {
          designId: 'design_1',
          customerEmail: 'client@example.com',
          customerName: 'Client Test',
          quantity: 3,
          shippingAddress: {
            firstName: '   Jane ',
            lastName: 'Doe',
            address1: '10 Rue de Paris',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
        } as unknown as any,
        { id: 'user_1', role: UserRole.PLATFORM_ADMIN },
      );

      expect(prismaMock.design.findUnique).toHaveBeenCalledWith({
        where: { id: 'design_1' },
        include: { product: true, brand: true },
      });

      const { data } = prismaMock.order.create.mock.calls[0][0];
      expect(data.subtotalCents).toBe(59970);
      expect(data.totalCents).toBe(71964);
      expect(data.metadata).toEqual({ quantity: 3, unitPriceCents: 19990 });
      expect(data.shippingAddress).toEqual({
        firstName: 'Jane',
        lastName: 'Doe',
        company: undefined,
        address1: '10 Rue de Paris',
        address2: undefined,
        city: 'Paris',
        state: '',
        postalCode: '75001',
        country: 'FR',
        phone: '',
      });

      expect(stripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              quantity: 3,
              price_data: expect.objectContaining({
                unit_amount: 19990, // Prix unitaire, pas le total
              }),
            }),
          ],
          success_url: 'https://app.luneo.dev/orders/order_1/success',
        }),
      );

      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: { stripeSessionId: 'cs_test_1' },
      });

      expect(result).toEqual(expect.objectContaining({ checkoutUrl: 'https://stripe.test/session/cs_test_1' }));
    });
  });

  describe('handleStripeCheckoutCompleted', () => {
    it('marque la commande comme payée et enfile un job de production', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_123',
        metadata: { orderId: 'order_1' },
        payment_intent: 'pi_test_123',
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order_1',
        brandId: 'brand_1',
        designId: 'design_1',
        productId: 'product_1',
        paymentStatus: PaymentStatus.PENDING,
        metadata: { quantity: 3 },
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Doe',
          address1: '123 Rue',
          city: 'Paris',
          state: 'IDF',
          postalCode: '75000',
          country: 'FR',
          phone: '+33123456789',
        },
        design: {
          options: {
            materials: ['gold', 'silver'],
            finishes: ['mat'],
            qualityLevel: 'premium',
          },
        },
        product: {
          metadata: {
            factoryWebhookUrl: 'https://factory.example.com/webhook',
          },
        },
      });

      prismaMock.order.update.mockResolvedValue({});
      productionQueueMock.enqueueCreateBundle.mockResolvedValue({});

      await service.handleStripeCheckoutCompleted(session);

      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        include: {
          design: true,
          product: true,
        },
      });

      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: expect.objectContaining({
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.SUCCEEDED,
          stripePaymentId: 'pi_test_123',
          paidAt: expect.any(Date),
        }),
      });

      expect(productionQueueMock.enqueueCreateBundle).toHaveBeenCalledWith({
        orderId: 'order_1',
        brandId: 'brand_1',
        designId: 'design_1',
        productId: 'product_1',
        quantity: 3,
        priority: 'normal',
        options: {
          materials: ['gold', 'silver'],
          finishes: ['mat'],
          qualityLevel: 'premium',
        },
        factoryWebhookUrl: 'https://factory.example.com/webhook',
        shippingAddress: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          address1: '123 Rue',
        }),
        billingAddress: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          address1: '123 Rue',
        }),
      });
    });

    it('ignore une commande déjà payée', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_123',
        metadata: { orderId: 'order_1' },
        payment_intent: 'pi_test_123',
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order_1',
        paymentStatus: PaymentStatus.SUCCEEDED,
      });

      await service.handleStripeCheckoutCompleted(session);

      expect(prismaMock.order.update).not.toHaveBeenCalled();
      expect(productionQueueMock.enqueueCreateBundle).not.toHaveBeenCalled();
    });

    it('ignore les sessions sans orderId', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_999',
        metadata: {},
      } as unknown as Stripe.Checkout.Session;

      await service.handleStripeCheckoutCompleted(session);

      expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
      expect(productionQueueMock.enqueueCreateBundle).not.toHaveBeenCalled();
    });

    it('ignore si la commande est introuvable', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_missing',
        metadata: { orderId: 'missing' },
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.findUnique.mockResolvedValue(null);

      await service.handleStripeCheckoutCompleted(session);

      expect(productionQueueMock.enqueueCreateBundle).not.toHaveBeenCalled();
    });

    it('récupère le payment intent depuis un objet stripe', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_pi',
        metadata: { orderId: 'order_pi' },
        payment_intent: { id: 'pi_123' },
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order_pi',
        brandId: 'brand_1',
        designId: 'design_1',
        productId: 'product_1',
        paymentStatus: PaymentStatus.PENDING,
        metadata: {},
        shippingAddress: {},
        design: { options: {}, id: 'design_1' },
        product: {},
      });

      prismaMock.order.update.mockResolvedValue({});
      productionQueueMock.enqueueCreateBundle.mockResolvedValue({ id: 'job' });

      await service.handleStripeCheckoutCompleted(session);

      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripePaymentId: 'pi_123',
          }),
        }),
      );
    });

    it('remonte une erreur si la mise en file de production échoue', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_fail',
        metadata: { orderId: 'order_fail' },
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order_fail',
        brandId: 'brand_1',
        designId: 'design_1',
        productId: 'product_1',
        paymentStatus: PaymentStatus.PENDING,
        metadata: {},
        shippingAddress: {},
        design: { options: {}, id: 'design_1' },
        product: {},
      });
      prismaMock.order.update.mockResolvedValue({});
      productionQueueMock.enqueueCreateBundle.mockRejectedValueOnce(new Error('queue failure'));

      await expect(service.handleStripeCheckoutCompleted(session)).rejects.toThrow('queue failure');
    });
  });

  describe('handleStripeCheckoutExpired', () => {
    it('annule la commande en attente de paiement', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_123',
        metadata: { orderId: 'order_1' },
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

      await service.handleStripeCheckoutExpired(session);

      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order_1',
          paymentStatus: { in: [PaymentStatus.PENDING] },
        },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    });

    it('ignore les sessions expirées sans orderId', async () => {
      const service = buildService();
      const session = {
        id: 'cs_no_order',
        metadata: {},
      } as unknown as Stripe.Checkout.Session;

      await service.handleStripeCheckoutExpired(session);

      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('handleStripePaymentFailed', () => {
    it('marque la commande comme payment failed', async () => {
      const service = buildService();
      const session = {
        id: 'cs_test_456',
        metadata: { orderId: 'order_2' },
      } as unknown as Stripe.Checkout.Session;

      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

      await service.handleStripePaymentFailed(session);

      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order_2',
          paymentStatus: { in: [PaymentStatus.PENDING] },
        },
        data: {
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    });

    it('ignore les échecs de paiement sans orderId', async () => {
      const service = buildService();
      const session = {
        id: 'cs_fail_no_order',
        metadata: {},
      } as unknown as Stripe.Checkout.Session;

      await service.handleStripePaymentFailed(session);

      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('retourne la commande lorsque l’utilisateur est autorisé', async () => {
      const service = buildService();
      const order = { id: 'order_1', brandId: 'brand_1' };
      prismaMock.order.findUnique.mockResolvedValue(order);

      const result = await service.findOne('order_1', { role: UserRole.BRAND_ADMIN, brandId: 'brand_1' });

      expect(result).toBe(order);
      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        include: expect.any(Object),
      });
    });

    it('lève une exception si la commande est introuvable', async () => {
      const service = buildService();
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', { role: UserRole.PLATFORM_ADMIN })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lève une exception si la marque ne correspond pas', async () => {
      const service = buildService();
      prismaMock.order.findUnique.mockResolvedValue({ id: 'order_1', brandId: 'brand_2' });

      await expect(
        service.findOne('order_1', { role: UserRole.BRAND_ADMIN, brandId: 'brand_1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('annule une commande créée', async () => {
      const service = buildService();
      const order = {
        id: 'order_1',
        brandId: 'brand_1',
        status: OrderStatus.CREATED,
        paymentStatus: PaymentStatus.PENDING,
        notes: null,
        metadata: null,
      };
      prismaMock.order.findUnique.mockResolvedValue(order);
      prismaMock.order.update.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

      const result = await service.cancel('order_1', { role: UserRole.BRAND_ADMIN, brandId: 'brand_1' });

      expect(result).toEqual({ ...order, status: OrderStatus.CANCELLED });
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: expect.objectContaining({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING, // Garde le statut existant si pas SUCCEEDED
        }),
      });
    });

    it('refuse l’annulation si le statut n’est pas annulable', async () => {
      const service = buildService();
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order_1',
        brandId: 'brand_1',
        status: OrderStatus.SHIPPED, // Statut non annulable
        paymentStatus: PaymentStatus.SUCCEEDED,
      });

      await expect(
        service.cancel('order_1', { role: UserRole.BRAND_ADMIN, brandId: 'brand_1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('helpers', () => {
    it('extractProductionOptions gère les valeurs non valides et converte correctement', () => {
      const service = buildService();
      const resultEmpty = (service as unknown as { extractProductionOptions: (input: unknown) => unknown }).extractProductionOptions(
        null,
      );
      expect(resultEmpty).toEqual({});

      const options = (service as unknown as { extractProductionOptions: (input: unknown) => unknown }).extractProductionOptions({
        materials: ['gold', 123, ''],
        finishes: ['mat'],
        specialInstructions: ['Handle with care', 9],
        specialRequirements: ['Temperature controlled', null],
        qualityLevel: 'premium',
        packaging: 'foam',
        rush: true,
      });

      expect(options).toEqual({
        materials: ['gold'],
        finishes: ['mat'],
        specialInstructions: ['Handle with care'],
        specialRequirements: ['Temperature controlled'],
        qualityLevel: 'premium',
        packaging: 'foam',
        rush: true,
      });
    });

    it('extractFactoryWebhookUrl priorise le champ direct puis metadata', () => {
      const service = buildService();
      const direct = (service as unknown as { extractFactoryWebhookUrl: (input: unknown) => string | undefined }).extractFactoryWebhookUrl(
        { factoryWebhookUrl: 'https://factory.direct' },
      );
      expect(direct).toBe('https://factory.direct');

      const metadata = (service as unknown as { extractFactoryWebhookUrl: (input: unknown) => string | undefined }).extractFactoryWebhookUrl(
        { metadata: { factoryWebhookUrl: 'https://factory.meta' } },
      );
      expect(metadata).toBe('https://factory.meta');

      const none = (service as unknown as { extractFactoryWebhookUrl: (input: unknown) => string | undefined }).extractFactoryWebhookUrl(
        { metadata: { other: 'value' } },
      );
      expect(none).toBeUndefined();
    });

    it('sanitizeAddress applique valeurs par défaut et trim les champs', () => {
      const service = buildService();
      const sanitized = (service as unknown as { sanitizeAddress: (input: unknown) => any }).sanitizeAddress({
        firstName: '  Jane ',
        lastName: '  ',
        address1: '  10 Rue ',
        city: '',
        postalCode: '75001',
        country: 'FR ',
        phone: '  +33123456789',
      });

      expect(sanitized).toEqual({
        firstName: 'Jane',
        lastName: 'Luneo',
        company: undefined,
        address1: '10 Rue',
        address2: undefined,
        city: '',
        state: '',
        postalCode: '75001',
        country: 'FR',
        phone: '+33123456789',
      });

      const defaultAddress = (service as unknown as { sanitizeAddress: (input: unknown) => any }).sanitizeAddress(null);
      expect(defaultAddress).toEqual({
        firstName: 'Client',
        lastName: 'Luneo',
        company: undefined,
        address1: '',
        address2: undefined,
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
      });
    });

    it('extractPaymentIntent et extractQuantity gèrent différentes formes', () => {
      const service = buildService();
      const extractPaymentIntent = (service as unknown as { extractPaymentIntent: (input: unknown) => string | undefined })
        .extractPaymentIntent;
      expect(extractPaymentIntent(undefined)).toBeUndefined();
      expect(extractPaymentIntent('pi_123')).toBe('pi_123');
      expect(extractPaymentIntent({ id: 'pi_obj' })).toBe('pi_obj');
      expect(extractPaymentIntent({ other: 'value' })).toBeUndefined();

      const extractQuantity = (service as unknown as { extractQuantity: (input: unknown) => number }).extractQuantity;
      expect(extractQuantity({ quantity: 5 })).toBe(5);
      expect(extractQuantity({ quantity: -1 })).toBe(1);
      expect(extractQuantity({ quantity: '10' })).toBe(1);
      expect(extractQuantity(null)).toBe(1);

      const normalizeQuantity = (service as unknown as { normalizeQuantity: (input: unknown) => number }).normalizeQuantity;
      expect(normalizeQuantity(3)).toBe(3);
      expect(normalizeQuantity('4')).toBe(4);
      expect(normalizeQuantity('0')).toBe(1);
    });
  });
});

