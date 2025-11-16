import type { Queue } from 'bullmq';
import { JobNames } from '../../../jobs/job.constants';
import { RenderJobQueueService } from './render-job-queue.service';
import type { RenderJobData, BatchRenderJobPayload } from '../interfaces/render-job.interface';

describe('RenderJobQueueService', () => {
  let queueMock: { add: jest.Mock };
  let service: RenderJobQueueService;

  beforeEach(() => {
    queueMock = {
      add: jest.fn(),
    };

    service = new RenderJobQueueService(queueMock as unknown as Queue);
  });

  it('enqueues render job with merged options', async () => {
    const payload: RenderJobData = {
      renderId: 'render-1',
      type: '2d',
      productId: 'product-1',
      designId: 'design-1',
      options: {
        width: 1024,
        height: 768,
        quality: 'standard',
      },
      priority: 'normal',
      userId: 'user-1',
      brandId: 'brand-1',
    };

    queueMock.add.mockResolvedValue({ id: 'render-job' });

    await service.enqueueRenderJob(JobNames.RENDER.RENDER_2D, payload, {
      attempts: 5,
    });

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.RENDER.RENDER_2D,
      payload,
      expect.objectContaining({
        attempts: 5,
        removeOnComplete: 200,
        removeOnFail: 50,
      }),
    );
  });

  it('enqueues batch render job with defaults', async () => {
    const payload: BatchRenderJobPayload = {
      batchId: 'batch-1',
      renders: [],
    };

    queueMock.add.mockResolvedValue({ id: 'batch-job' });

    await service.enqueueBatch(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.RENDER.BATCH_RENDER,
      payload,
      expect.objectContaining({
        attempts: 2,
      }),
    );
  });
});

