import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { randomBytes, createHash } from 'crypto';
import { AgentsService } from '@/modules/agents/agents.service';
import { WebhooksService } from '@/modules/webhooks/webhooks.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

const DEFAULT_API_KEY_SCOPES = ['conversations:read', 'contacts:read'];
const DEFAULT_API_KEY_PERMISSIONS = ['conversations:read', 'contacts:read'];

@Injectable()
export class PublicApiService {
  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly agentsService: AgentsService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async listConversations(organizationId: string, limit = 20) {
    return this.prisma.conversation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(limit, 100)),
      select: {
        id: true,
        status: true,
        channelType: true,
        createdAt: true,
        updatedAt: true,
        messageCount: true,
        contactId: true,
      },
    });
  }

  async listContacts(organizationId: string, limit = 20) {
    return this.prisma.contact.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(limit, 100)),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        leadScore: true,
        leadStatus: true,
        churnRisk: true,
      },
    });
  }

  async createOutboundMessage(input: {
    organizationId: string;
    conversationId: string;
    content: string;
  }) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: input.conversationId, organizationId: input.organizationId },
      select: { id: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable pour cette organisation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        role: 'ASSISTANT',
        content: input.content,
        contentType: 'text',
      },
      select: {
        id: true,
        conversationId: true,
        createdAt: true,
      },
    });

    await this.webhooksService.dispatchEvent(
      input.organizationId,
      'public.message.created',
      {
        messageId: message.id,
        conversationId: message.conversationId,
        createdAt: message.createdAt.toISOString(),
      },
    );

    return message;
  }

  async listApiKeys(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        permissions: true,
        rateLimit: true,
        allowedIps: true,
        usageCount: true,
        lastUsedAt: true,
        lastUsedIp: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }

  async listDeveloperAudits(organizationId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        action: { startsWith: 'public_api.' },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        success: true,
        error: true,
        createdAt: true,
      },
    });
  }

  async createApiKey(organizationId: string, dto: CreateApiKeyDto) {
    const rawKey = this.generateApiKey(dto.sandbox ?? false);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 14);

    const created = await this.prisma.apiKey.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        keyHash,
        keyPrefix,
        scopes: dto.scopes?.length ? dto.scopes : DEFAULT_API_KEY_SCOPES,
        permissions: dto.permissions?.length
          ? dto.permissions
          : DEFAULT_API_KEY_PERMISSIONS,
        allowedIps: dto.allowedIps ?? [],
        rateLimit: dto.rateLimit ?? 1000,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        permissions: true,
        rateLimit: true,
        allowedIps: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    const response = {
      ...created,
      rawKey,
      warning:
        'Cette cle est affichee une seule fois. Stockez-la de facon securisee.',
    };

    await this.createDeveloperAuditLog({
      organizationId,
      action: 'public_api.key_created',
      resource: 'api_key',
      resourceId: created.id,
      metadata: {
        name: created.name,
        scopes: created.scopes,
        permissions: created.permissions,
        sandbox: dto.sandbox ?? false,
      },
    });

    return response;
  }

  async revokeApiKey(organizationId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId },
      select: { id: true, revokedAt: true },
    });
    if (!key) throw new NotFoundException('Cle API introuvable');
    if (key.revokedAt) throw new ForbiddenException('Cle API deja revoquee');

    const revoked = await this.prisma.apiKey.update({
      where: { id: key.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        isActive: true,
        revokedAt: true,
      },
    });

    await this.createDeveloperAuditLog({
      organizationId,
      action: 'public_api.key_revoked',
      resource: 'api_key',
      resourceId: key.id,
      metadata: {},
    });

    return revoked;
  }

  async rotateApiKey(organizationId: string, keyId: string) {
    const previous = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId, isActive: true },
    });
    if (!previous) throw new NotFoundException('Cle API active introuvable');

    await this.prisma.apiKey.update({
      where: { id: previous.id },
      data: { isActive: false, revokedAt: new Date() },
    });

    const rotated = await this.createApiKey(organizationId, {
      name: `${previous.name} (rotated)`,
      scopes: previous.scopes,
      permissions: previous.permissions,
      allowedIps: previous.allowedIps,
      rateLimit: previous.rateLimit,
      expiresAt: previous.expiresAt?.toISOString(),
      sandbox: previous.keyPrefix.startsWith('lun_sbx_'),
    });

    await this.createDeveloperAuditLog({
      organizationId,
      action: 'public_api.key_rotated',
      resource: 'api_key',
      resourceId: keyId,
      metadata: { newKeyPrefix: rotated.keyPrefix },
    });

    return rotated;
  }

  async runSandboxAgent(
    organizationId: string,
    agentId: string,
    input: { message: string },
  ) {
    const result = await this.agentsService.testAgent(
      agentId,
      organizationId,
      input.message,
    );
    await this.createDeveloperAuditLog({
      organizationId,
      action: 'public_api.sandbox_execute',
      resource: 'agent',
      resourceId: agentId,
      metadata: { inputLength: input.message.length },
    });
    return {
      sandbox: true,
      agentId,
      ...result,
    };
  }

  getSdkSnippets(baseUrl: string) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    return {
      typescript: `const response = await fetch("${normalizedBaseUrl}/api/v1/public/conversations", {
  headers: { "x-api-key": process.env.LUNEO_API_KEY! }
});
const conversations = await response.json();`,
      python: `import requests

response = requests.get(
    "${normalizedBaseUrl}/api/v1/public/conversations",
    headers={"x-api-key": "<LUNEO_API_KEY>"}
)
print(response.json())`,
      curl: `curl -H "x-api-key: <LUNEO_API_KEY>" "${normalizedBaseUrl}/api/v1/public/conversations"`,
    };
  }

  private generateApiKey(sandbox: boolean): string {
    const prefix = sandbox ? 'lun_sbx_' : 'lun_live_';
    return `${prefix}${randomBytes(24).toString('hex')}`;
  }

  private async createDeveloperAuditLog(input: {
    organizationId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: input.metadata as import('@prisma/client').Prisma.InputJsonValue,
        success: true,
      },
    });
  }
}
