import { BadRequestException } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';

describe('StripeWebhookController', () => {
  const stripeService = {
    handleWebhookEvent: jest.fn(),
  };

  const controller = new StripeWebhookController(stripeService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('utilise rawBody quand present', async () => {
    const rawBody = Buffer.from('{"id":"evt_1"}', 'utf8');
    const req: any = {
      rawBody,
      body: { id: 'evt_should_not_be_used' },
    };

    const result = await controller.handleWebhook(req, 'sig_123');

    expect(result).toEqual({ received: true });
    expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(rawBody, 'sig_123');
  });

  it('fallback sur body string si rawBody absent', async () => {
    const req: any = {
      body: '{"id":"evt_2"}',
    };

    await controller.handleWebhook(req, 'sig_456');

    expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
      Buffer.from('{"id":"evt_2"}', 'utf8'),
      'sig_456',
    );
  });

  it('rejette si signature absente', async () => {
    const req: any = { body: '{"id":"evt_3"}' };

    await expect(controller.handleWebhook(req, '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejette si payload invalide', async () => {
    const req: any = { body: { event: 'invalid' } };

    await expect(controller.handleWebhook(req, 'sig_789')).rejects.toThrow(
      BadRequestException,
    );
  });
});
