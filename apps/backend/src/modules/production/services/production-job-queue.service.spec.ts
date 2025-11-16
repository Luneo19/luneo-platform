import type { Queue } from 'bullmq';
import { JobNames } from '../../../jobs/job.constants';
import { ProductionJobQueueService } from './production-job-queue.service';
import type {
  ProductionJobData,
  ProductionTrackingPayload,
} from '../interfaces/production-jobs.interface';

describe('ProductionJobQueueService', () => {
  let queueMock: { add: jest.Mock };
  let service: ProductionJobQueueService;

  beforeEach(() => {
    queueMock = {
      add: jest.fn(),
    };

    service = new ProductionJobQueueService(queueMock as unknown as Queue);
  });

  it('enqueues create bundle job', async () => {
    const payload: ProductionJobData = {
      orderId: 'order-1',
      brandId: 'brand-1',
      designId: 'design-1',
      productId: 'product-1',
      quantity: 10,
      options: {},
      priority: 'normal',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'Paris',
        state: 'IDF',
        postalCode: '75000',
        country: 'FR',
        phone: '+33123456789',
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'Paris',
        state: 'IDF',
        postalCode: '75000',
        country: 'FR',
        phone: '+33123456789',
      },
    };

    queueMock.add.mockResolvedValue({ id: 'prod-job' });

    await service.enqueueCreateBundle(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.PRODUCTION.CREATE_BUNDLE,
      payload,
      expect.any(Object),
    );
  });

  it('enqueues tracking job', async () => {
    const payload: ProductionTrackingPayload = {
      orderId: 'order-2',
      factoryId: 'factory-1',
    };

    queueMock.add.mockResolvedValue({ id: `${payload.orderId}:factory-1` });

    const result = await service.enqueueTracking(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.PRODUCTION.TRACK_PRODUCTION,
      payload,
      expect.any(Object),
    );
    expect(result).toEqual({ id: `${payload.orderId}:factory-1` });
  });

  it('enqueues quality control job', async () => {
    const address = {
      firstName: 'Ana',
      lastName: 'Doe',
      address1: '5 rue du Port',
      city: 'Lyon',
      state: 'ARA',
      postalCode: '69000',
      country: 'FR',
      phone: '+33400000000',
    };
    const payload = {
      orderId: 'order-3',
      brandId: 'brand-1',
      designId: 'design-1',
      productId: 'product-1',
      quantity: 1,
      options: {},
      priority: 'high' as const,
      shippingAddress: address,
      billingAddress: address,
    } as unknown as ProductionJobData;

    queueMock.add.mockResolvedValue({ id: 'quality-job' });

    await service.enqueueQualityControl(payload, { attempts: 5 });

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.PRODUCTION.QUALITY_CONTROL,
      payload,
      expect.objectContaining({ attempts: 5 }),
    );
  });

  it('enqueues instructions job with default options', async () => {
    const address = {
      firstName: 'Eve',
      lastName: 'Doe',
      address1: '10 Avenue',
      city: 'Marseille',
      state: 'PAC',
      postalCode: '13000',
      country: 'FR',
      phone: '+33411111111',
    };
    const payload = {
      orderId: 'order-4',
      brandId: 'brand-1',
      designId: 'design-1',
      productId: 'product-1',
      quantity: 2,
      options: {},
      priority: 'urgent' as const,
      shippingAddress: address,
      billingAddress: address,
    } as unknown as ProductionJobData;

    queueMock.add.mockResolvedValue({ id: 'instructions-job' });

    await service.enqueueInstructions(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.PRODUCTION.GENERATE_INSTRUCTIONS,
      payload,
      expect.objectContaining({ removeOnComplete: 200, removeOnFail: 50, attempts: 2 }),
    );
  });

  it('enqueues generic job via enqueueJob', async () => {
    const payload: ProductionTrackingPayload = {
      orderId: 'order-5',
      factoryId: 'factory-2',
    };

    queueMock.add.mockResolvedValue({ id: 'generic-job' });

    await service.enqueueJob('track-production', payload, { delay: 5000 });

    expect(queueMock.add).toHaveBeenCalledWith(
      'track-production',
      payload,
      expect.objectContaining({ delay: 5000, removeOnComplete: 200 }),
    );
  });
});

