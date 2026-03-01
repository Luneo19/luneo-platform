import { Test, TestingModule } from '@nestjs/testing';
import { PublicApiController } from '../public-api.controller';
import { PublicApiService } from '../public-api.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiScopeGuard } from '../guards/api-scope.guard';
import { ApiPermissionGuard } from '../guards/api-permission.guard';
import { ApiQuotaGuard } from '../guards/api-quota.guard';

describe('PublicApiController', () => {
  let controller: PublicApiController;
  const service = {
    listConversations: jest.fn(),
    listContacts: jest.fn(),
    createOutboundMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicApiController],
      providers: [{ provide: PublicApiService, useValue: service }],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ApiScopeGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ApiPermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ApiQuotaGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(PublicApiController);
  });

  it('liste les conversations avec org scope', async () => {
    service.listConversations.mockResolvedValue([{ id: 'c1' }]);
    const req = { publicApiAuth: { organizationId: 'org_1' } } as any;

    const result = await controller.listConversations(req, 25);

    expect(service.listConversations).toHaveBeenCalledWith('org_1', 25);
    expect(result).toEqual([{ id: 'c1' }]);
  });

  it('liste les contacts avec org scope', async () => {
    service.listContacts.mockResolvedValue([{ id: 'ct_1' }]);
    const req = { publicApiAuth: { organizationId: 'org_1' } } as any;

    const result = await controller.listContacts(req, 10);

    expect(service.listContacts).toHaveBeenCalledWith('org_1', 10);
    expect(result).toEqual([{ id: 'ct_1' }]);
  });

  it('envoie un message sortant', async () => {
    const created = { id: 'm1', conversationId: 'conv_1' };
    service.createOutboundMessage.mockResolvedValue(created);
    const req = { publicApiAuth: { organizationId: 'org_1' } } as any;

    const result = await controller.sendMessage(req, {
      conversationId: 'conv_1',
      content: 'Bonjour',
    });

    expect(service.createOutboundMessage).toHaveBeenCalledWith({
      organizationId: 'org_1',
      conversationId: 'conv_1',
      content: 'Bonjour',
    });
    expect(result).toEqual(created);
  });
});
