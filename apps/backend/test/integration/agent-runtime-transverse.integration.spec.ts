import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  createIntegrationTestApp,
  closeIntegrationTestApp,
} from '@/common/test/test-app.module';

describeIntegration('Agent Runtime Transverse Flow Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it(
    'executes vertical/contact/conversation/escalation/learning/memory/actions/automation/roi flow',
    async () => {
      const schemaCheck = (await prisma.$queryRawUnsafe(
        "SELECT to_regclass('public.users')::text AS users_table",
      )) as Array<{ users_table: string | null }>;
      if (!schemaCheck[0]?.users_table) {
        // Environment guard: integration DB exists but schema is not provisioned.
        return;
      }

      const suffix = `${Date.now()}`;
      const email = `flow-${suffix}@example.com`;
      const password = 'StrongP@ss123!';

      const signupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email,
          password,
          firstName: 'Flow',
          lastName: 'Tester',
        })
        .expect(201);

      const signupData = signupRes.body.data ?? signupRes.body;
      const accessToken: string = signupData.accessToken;
      const userId: string = signupData.user?.id;
      expect(accessToken).toBeDefined();
      expect(userId).toBeDefined();

      const userWithMembership = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            where: { isActive: true },
            take: 1,
          },
        },
      });
      expect(userWithMembership).toBeDefined();
      const organizationId = userWithMembership?.memberships?.[0]?.organizationId;
      expect(organizationId).toBeDefined();

      const agent = await prisma.agent.create({
        data: {
          organizationId: organizationId!,
          name: `Agent Flow ${suffix}`,
          status: 'ACTIVE',
          modules: {},
          systemPrompt: 'Tu es un assistant IA business.',
        },
      });

      const templatesRes = await request(app.getHttpServer())
        .get('/api/v1/verticals/templates')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const templates = templatesRes.body.data ?? [];
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      const selectedSlug = templates[0].slug;
      await request(app.getHttpServer())
        .post('/api/v1/verticals/select')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ slug: selectedSlug, onboardingData: { source: 'integration-test' } })
        .expect(201);

      const contactRes = await request(app.getHttpServer())
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: `contact-${suffix}@example.com`,
          firstName: 'Contact',
          lastName: 'Flow',
          aiProfile: { preferredLanguage: 'fr' },
        })
        .expect(201);
      const contact = contactRes.body.data;
      expect(contact?.id).toBeDefined();

      const conversationRes = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          agentId: agent.id,
          channelType: 'WIDGET',
          visitorEmail: `visitor-${suffix}@example.com`,
          visitorName: 'Visitor Flow',
          language: 'fr',
        })
        .expect(201);
      const conversation = conversationRes.body;
      expect(conversation?.id).toBeDefined();

      await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversation.id}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'USER',
          content: 'Bonjour, je veux des infos sur les retours.',
        })
        .expect(201);

      const escalatedRes = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversation.id}/escalate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
      expect(escalatedRes.body.status).toBe('ESCALATED');

      const resolvedRes = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversation.id}/resolve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
      expect(resolvedRes.body.status).toBe('RESOLVED');

      await request(app.getHttpServer())
        .post('/api/v1/learning/signals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          conversationId: conversation.id,
          signalType: 'KNOWLEDGE_GAP',
          data: {
            question: 'Quels sont les delais de remboursement ?',
            category: 'returns',
          },
        })
        .expect(201);

      const gapsRes = await request(app.getHttpServer())
        .get('/api/v1/learning/gaps')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const gapsPayload = gapsRes.body.data;
      expect(Array.isArray(gapsPayload.items)).toBe(true);
      expect(gapsPayload.items.length).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .post(`/api/v1/learning/gaps/${gapsPayload.items[0].id}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const summarizeRes = await request(app.getHttpServer())
        .post('/api/v1/memory/conversations/summarize')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ conversationId: conversation.id })
        .expect(201);
      expect(summarizeRes.body.data?.id).toBe(conversation.id);

      await request(app.getHttpServer())
        .get(`/api/v1/memory/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const actionCatalogRes = await request(app.getHttpServer())
        .get('/api/v1/actions/catalog')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(Array.isArray(actionCatalogRes.body.data)).toBe(true);

      const workflowRes = await request(app.getHttpServer())
        .post('/api/v1/automation/workflows')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Workflow Flow ${suffix}`,
          triggerType: 'MANUAL',
          isActive: true,
          steps: {
            nodes: [
              { id: 'start_1', type: 'start', data: {}, next: 'msg_1' },
              {
                id: 'msg_1',
                type: 'message',
                data: { text: 'Reponse workflow: {{user_message}}' },
                next: 'end_1',
              },
              { id: 'end_1', type: 'end', data: {} },
            ],
          },
        })
        .expect(201);
      const workflow = workflowRes.body.data;
      expect(workflow?.id).toBeDefined();

      const executeWorkflowRes = await request(app.getHttpServer())
        .post('/api/v1/automation/workflows/execute')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workflowId: workflow.id,
          agentId: agent.id,
          conversationId: conversation.id,
          userMessage: 'test automation',
        })
        .expect(201);
      expect(executeWorkflowRes.body.data.response).toContain('test automation');

      const roiRes = await request(app.getHttpServer())
        .get('/api/v1/roi/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(roiRes.body.data).toHaveProperty('roi');
      expect(roiRes.body.data).toHaveProperty('activity');
    },
    120000,
  );
});
