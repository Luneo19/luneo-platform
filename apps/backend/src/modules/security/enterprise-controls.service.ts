import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface PolicyDocument {
  version: string;
  rules: Array<{
    id: string;
    effect: 'allow' | 'deny';
    action: string;
    resource: string;
    condition?: Record<string, unknown>;
  }>;
}

@Injectable()
export class EnterpriseControlsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnterpriseReadiness(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        plan: true,
        stripeSubscriptionId: true,
        apiKeys: { select: { id: true } },
      },
    });
    if (!org) {
      throw new Error('Organisation introuvable');
    }

    const checks = {
      scimReady: org.plan === 'ENTERPRISE',
      policyAsCodeReady: org.apiKeys.length > 0,
      byokReady: org.plan === 'ENTERPRISE',
      isolatedEnvironmentReady: org.plan === 'BUSINESS' || org.plan === 'ENTERPRISE',
    };

    const score =
      (Number(checks.scimReady) +
        Number(checks.policyAsCodeReady) +
        Number(checks.byokReady) +
        Number(checks.isolatedEnvironmentReady)) *
      25;

    return {
      organizationId: org.id,
      plan: org.plan,
      readinessScore: score,
      checks,
      recommendations: this.recommendationsFromChecks(checks),
    };
  }

  validatePolicyDocument(policy: PolicyDocument) {
    if (!policy.version || !Array.isArray(policy.rules)) {
      return { valid: false, errors: ['version/rules manquants'] };
    }
    const errors: string[] = [];
    policy.rules.forEach((rule, idx) => {
      if (!rule.id) errors.push(`rules[${idx}].id manquant`);
      if (rule.effect !== 'allow' && rule.effect !== 'deny') {
        errors.push(`rules[${idx}].effect invalide`);
      }
      if (!rule.action) errors.push(`rules[${idx}].action manquante`);
      if (!rule.resource) errors.push(`rules[${idx}].resource manquante`);
    });
    return { valid: errors.length === 0, errors };
  }

  private recommendationsFromChecks(checks: {
    scimReady: boolean;
    policyAsCodeReady: boolean;
    byokReady: boolean;
    isolatedEnvironmentReady: boolean;
  }): string[] {
    const recommendations: string[] = [];
    if (!checks.scimReady) recommendations.push('Passer sur offre Enterprise pour SCIM.');
    if (!checks.policyAsCodeReady)
      recommendations.push('Créer au moins une clé API et activer un bundle de policies.');
    if (!checks.byokReady) recommendations.push('Activer BYOK sur contrat enterprise.');
    if (!checks.isolatedEnvironmentReady)
      recommendations.push('Activer un environnement isolé (Business/Enterprise).');
    return recommendations;
  }
}

