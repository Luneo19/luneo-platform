import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

type JsonObject = Record<string, unknown>;

@Injectable()
export class EnterpriseReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        features: true,
      },
    });
    if (!org) throw new NotFoundException('Organisation introuvable');

    const features = (org.features ?? {}) as JsonObject;
    const security = (features.security ?? {}) as JsonObject;
    const identity = (features.identity ?? {}) as JsonObject;
    const data = (features.dataGovernance ?? {}) as JsonObject;

    const readinessFlags = {
      scimProvisioning: identity.scimProvisioning === true,
      samlSso: identity.samlSso === true,
      policyAsCode: security.policyAsCode === true,
      byok: security.byok === true,
      environmentIsolation: security.environmentIsolation === true,
    };
    const enforcementFlags = {
      scimProvisioning: identity.scimProvisioningEnforced === true,
      samlSso: identity.samlSsoEnforced === true,
      policyAsCode: security.policyAsCodeEnforced === true,
      byok: security.byokEnforced === true,
      environmentIsolation: security.environmentIsolationEnforced === true,
    };

    return {
      organizationId: org.id,
      organizationName: org.name,
      controls: {
        scimProvisioning: {
          requested: readinessFlags.scimProvisioning,
          enforced: enforcementFlags.scimProvisioning,
        },
        samlSso: {
          requested: readinessFlags.samlSso,
          enforced: enforcementFlags.samlSso,
        },
        policyAsCode: {
          requested: readinessFlags.policyAsCode,
          enforced: enforcementFlags.policyAsCode,
        },
        byok: {
          requested: readinessFlags.byok,
          enforced: enforcementFlags.byok,
        },
        environmentIsolation: {
          requested: readinessFlags.environmentIsolation,
          enforced: enforcementFlags.environmentIsolation,
        },
        dataResidency: {
          requested: data.dataResidency ?? 'shared',
          enforced: data.dataResidencyEnforced ?? 'shared',
        },
      },
      readinessScore: this.computeReadinessScore(readinessFlags),
    };
  }

  async configureScim(
    organizationId: string,
    input: { enabled: boolean; endpoint?: string; tokenMasked?: string },
  ) {
    return this.mergeFeatures(organizationId, {
      identity: {
        scimProvisioning: input.enabled,
        scimProvisioningRequested: input.enabled,
        scimProvisioningEnforced: false,
        scimEndpoint: input.endpoint ?? null,
        scimTokenMasked: input.tokenMasked ?? null,
      },
    });
  }

  async configurePolicyAsCode(
    organizationId: string,
    input: { enabled: boolean; policyBundleVersion?: string },
  ) {
    return this.mergeFeatures(organizationId, {
      security: {
        policyAsCode: input.enabled,
        policyAsCodeRequested: input.enabled,
        policyAsCodeEnforced: false,
        policyBundleVersion: input.policyBundleVersion ?? null,
      },
    });
  }

  async configureByok(
    organizationId: string,
    input: { enabled: boolean; kmsProvider?: 'aws-kms' | 'gcp-kms' | 'azure-key-vault' },
  ) {
    return this.mergeFeatures(organizationId, {
      security: {
        byok: input.enabled,
        byokRequested: input.enabled,
        byokEnforced: false,
        kmsProvider: input.kmsProvider ?? null,
      },
    });
  }

  async configureEnvironmentIsolation(
    organizationId: string,
    input: { enabled: boolean; mode?: 'shared' | 'dedicated' },
  ) {
    return this.mergeFeatures(organizationId, {
      security: {
        environmentIsolation: input.enabled,
        environmentIsolationRequested: input.enabled,
        environmentIsolationEnforced: false,
      },
      dataGovernance: {
        dataResidency: input.mode ?? 'shared',
        dataResidencyEnforced: 'shared',
      },
    });
  }

  private async mergeFeatures(organizationId: string, patch: JsonObject) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, features: true },
    });
    if (!org) throw new NotFoundException('Organisation introuvable');

    const current = (org.features ?? {}) as JsonObject;
    const merged = deepMerge(current, patch);

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { features: merged as Prisma.InputJsonValue },
      select: { id: true, features: true, updatedAt: true },
    });

    return {
      organizationId: updated.id,
      features: updated.features,
      updatedAt: updated.updatedAt,
    };
  }

  private computeReadinessScore(flags: {
    scimProvisioning: boolean;
    samlSso: boolean;
    policyAsCode: boolean;
    byok: boolean;
    environmentIsolation: boolean;
  }) {
    const total = 5;
    const enabled = [
      flags.scimProvisioning,
      flags.samlSso,
      flags.policyAsCode,
      flags.byok,
      flags.environmentIsolation,
    ].filter(Boolean).length;
    return Math.round((enabled / total) * 100);
  }
}

function deepMerge(base: JsonObject, patch: JsonObject): JsonObject {
  const out: JsonObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const currentValue = out[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
    ) {
      out[key] = deepMerge(currentValue as JsonObject, value as JsonObject);
    } else {
      out[key] = value;
    }
  }
  return out;
}

