import type { Queue } from 'bullmq';
import { AiQueueService } from './ai-queue.service';
import { JobNames } from '../../../jobs/job.constants';
import type { GenerateDesignJob, GenerateHighResJob } from '../../../jobs/interfaces/ai-jobs.interface';

describe('AiQueueService', () => {
  let queueMock: { add: jest.Mock };
  let service: AiQueueService;

  beforeEach(() => {
    queueMock = {
      add: jest.fn(),
    };

    service = new AiQueueService(queueMock as unknown as Queue);
  });

  it('enqueues design generation with defaults', async () => {
    const payload: GenerateDesignJob = {
      designId: 'design-1',
      prompt: 'Modern chair',
      options: {},
      userId: 'user-1',
      brandId: 'brand-1',
    };

    queueMock.add.mockResolvedValue({ id: 'job-123' });

    const jobId = await service.enqueueDesign(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.AI_GENERATION.GENERATE_DESIGN,
      payload,
      expect.objectContaining({
        attempts: 2,
        removeOnComplete: 200,
        removeOnFail: 50,
      }),
    );
    expect(jobId).toBe('job-123');
  });

  it('returns fallback id when queue does not provide one', async () => {
    const payload: GenerateDesignJob = {
      designId: 'design-2',
      prompt: 'Futuristic lamp',
      options: { style: 'futuristic' },
      userId: 'user-2',
      brandId: 'brand-2',
    };

    queueMock.add.mockResolvedValue({});

    const jobId = await service.enqueueDesign(payload);

    expect(jobId).toBe('design-2');
  });

  it('enqueues high-res generation', async () => {
    const payload: GenerateHighResJob = {
      designId: 'design-3',
      prompt: 'Art deco pattern',
      options: {},
      userId: 'user-3',
    };

    queueMock.add.mockResolvedValue({ id: 'job-hr' });

    const jobId = await service.enqueueHighRes(payload);

    expect(queueMock.add).toHaveBeenCalledWith(
      JobNames.AI_GENERATION.GENERATE_HIGH_RES,
      payload,
      expect.any(Object),
    );
    expect(jobId).toBe('job-hr');
  });

  it('returns fallback id for high-res when queue result lacks id', async () => {
    const payload: GenerateHighResJob = {
      designId: 'design-4',
      prompt: 'Minimalist sculpture',
      options: {},
      userId: 'user-4',
    };

    queueMock.add.mockResolvedValue({});

    const jobId = await service.enqueueHighRes(payload);

    expect(jobId).toBe('design-4:highres');
  });
});

