import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ChannelType } from '@prisma/client';
import { LlmService } from '@/libs/llm/llm.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { QuotasService } from '@/modules/quotas/quotas.service';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestModule,
} from '@/common/test/test-app.module';

describeIntegration('Orchestrator Runtime Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let orchestratorService: OrchestratorService;

  const llmServiceMock = {
    complete: jest.fn().mockResolvedValue({
      content: "Je ne sais pas avec certitude, je prefere une verification humaine.",
      model: 'gpt-4o-mini',
      tokensIn: 30,
      tokensOut: 15,
      costUsd: 0.001,
    }),
  };

  const quotasServiceMock = {
    enforceQuota: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleBuilder = await createIntegrationTestModule();
    moduleBuilder.overrideProvider(LlmService).useValue(llmServiceMock);
    moduleBuilder.overrideProvider(QuotasService).useValue(quotasServiceMock);

    moduleFixture = await moduleBuilder.compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    orchestratorService = moduleFixture.get<OrchestratorService>(OrchestratorService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('applies auto-escalation and keeps deterministic usage metering idempotency', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.organizations')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const suffix = Date.now().toString();
    const organization = await prisma.organization.create({
      data: {
        name: `Org Orchestrator ${suffix}`,
        slug: `org-orchestrator-${suffix}`,
      },
    });

    const agent = await prisma.agent.create({
      data: {
        organizationId: organization.id,
        name: `Agent Orchestrator ${suffix}`,
        status: 'ACTIVE',
        modules: {},
        systemPrompt: 'Tu es un agent IA.',
        confidenceThreshold: 0.8,
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        organizationId: organization.id,
        agentId: agent.id,
        channelType: ChannelType.WIDGET,
        status: 'ACTIVE',
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: 'Demande urgente de remboursement immediat',
      },
    });

    await orchestratorService.executeAgent(
      agent.id,
      conversation.id,
      'Demande urgente de remboursement immediat',
    );
    await orchestratorService.executeAgent(
      agent.id,
      conversation.id,
      'Demande urgente de remboursement immediat',
    );

    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      select: {
        status: true,
        escalationReason: true,
      },
    });
    expect(updatedConversation?.status).toBe('ESCALATED');
    expect(updatedConversation?.escalationReason).toBeDefined();

    const messageUsageRecords = await prisma.usageRecord.findMany({
      where: {
        organizationId: organization.id,
        type: 'MESSAGE',
        metadata: {
          path: ['source'],
          equals: 'orchestrator',
        },
      },
    });

    // Deterministic idempotency key should dedupe usage metering.
    expect(messageUsageRecords.length).toBe(1);
  }, 60000);
});
