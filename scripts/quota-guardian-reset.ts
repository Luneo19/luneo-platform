import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  PLAN_DEFINITIONS,
  type PlanTier,
  type UsageMetricType,
} from '@luneo/billing-plans';

type CliOptions = {
  brandId: string;
  metric: UsageMetricType;
  targetPercent: number;
  topupUnits: number;
  dryRun: boolean;
};

const prisma = new PrismaClient();

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback?: string) => {
    const flag = args.find((item) => item.startsWith(`--${name}`));
    if (!flag) {
      return fallback;
    }
    const [, value] = flag.split('=');
    return value ?? fallback;
  };

  const brandId = getArg('brand') ?? getArg('brandId');
  if (!brandId) {
    throw new Error('Argument manquant: --brand=<brandId>');
  }

  const metric = (getArg('metric', 'ai_generations') as UsageMetricType) ?? 'ai_generations';
  const targetPercent = Number(getArg('target', '90'));
  const topupUnits = Number(getArg('topup', '25'));
  const dryRun = args.includes('--dry-run') || args.includes('--dryRun');

  if (Number.isNaN(targetPercent) || targetPercent <= 0) {
    throw new Error('--target doit être un pourcentage positif (ex: 90).');
  }

  if (Number.isNaN(topupUnits) || topupUnits < 0) {
    throw new Error('--topup doit être >= 0.');
  }

  return {
    brandId,
    metric,
    targetPercent: Math.min(targetPercent, 150),
    topupUnits,
    dryRun,
  };
}

function getCurrentPeriodKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function resolvePlanForBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, name: true, plan: true },
  });

  if (!brand) {
    throw new Error(`Brand ${brandId} introuvable.`);
  }

  const planTier = (brand.plan?.toLowerCase() as PlanTier) ?? 'starter';
  const planDefinition = PLAN_DEFINITIONS[planTier] ?? PLAN_DEFINITIONS.starter;

  return {
    brand,
    planTier,
    planDefinition,
  };
}

async function run() {
  const options = parseArgs();
  const { brand, planTier, planDefinition } = await resolvePlanForBrand(options.brandId);

  const quotaDefinition = planDefinition.quotas.find((quota) => quota.metric === options.metric);
  if (!quotaDefinition) {
    throw new Error(
      `Le plan ${planDefinition.name} n'inclut pas la métrique ${options.metric}.`,
    );
  }

  const monthlyLimit = quotaDefinition.limit;
  const targetValue = Math.ceil((monthlyLimit * options.targetPercent) / 100);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const operations = [];
  operations.push(
    `Supprimer les UsageMetric depuis ${startOfMonth.toISOString()} pour brand=${options.brandId}`,
  );
  operations.push(
    `Insérer UsageMetric ${options.metric}=${targetValue} (${options.targetPercent}% du quota ${monthlyLimit}).`,
  );

  const recordTopUp = options.topupUnits > 0 && quotaDefinition.overageRate;
  if (recordTopUp) {
    operations.push(
      `Créer un UsageTopUp complété (${options.topupUnits} unités @ ${quotaDefinition.overageRate}c).`,
    );
  } else {
    operations.push('Top-up ignoré (0 unité ou métrique sans overage charge).');
  }

  console.log('🔁 Quota Guardian Reset');
  console.log(`   Brand: ${brand.name ?? brand.id} (${brand.id})`);
  console.log(`   Plan : ${planDefinition.name} [${planTier}]`);
  console.log(`   Metric: ${options.metric}`);
  console.log(`   Target: ${options.targetPercent}% (${targetValue}/${monthlyLimit})`);
  console.log(`   Top-up: ${options.topupUnits} unités`);
  console.log(`   Dry run: ${options.dryRun ? 'oui' : 'non'}`);

  console.log('\n📋 Opérations prévues:');
  operations.forEach((op) => console.log(` - ${op}`));

  if (options.dryRun) {
    console.log('\nMode dry-run activé. Aucune écriture effectuée.');
    return;
  }

  const periodKey = getCurrentPeriodKey();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.usageMetric.deleteMany({
      where: {
        brandId: options.brandId,
        timestamp: {
          gte: startOfMonth,
        },
      },
    });

    await tx.usageMetric.create({
      data: {
        brandId: options.brandId,
        metric: options.metric,
        value: targetValue,
        unit: quotaDefinition.unit ?? 'count',
        timestamp: now,
        metadata: {
          source: 'quota:reset-cli',
          targetPercent: options.targetPercent,
        },
      },
    });

    if (recordTopUp) {
      await tx.usageTopUp.create({
        data: {
          brandId: options.brandId,
          metric: options.metric,
          units: options.topupUnits,
          unitPriceCents: quotaDefinition.overageRate ?? 0,
          totalPriceCents: (quotaDefinition.overageRate ?? 0) * options.topupUnits,
          status: 'completed',
          periodKey,
          notes: `CLI quota reset ${periodKey}`,
        },
      });
    }
  });

  console.log('\n✅ Reset terminé.');
  console.log(`   ➜ Analytics: ${process.env.FRONTEND_URL ?? 'https://app.luneo.app'}/analytics`);
  console.log(`   ➜ Monitoring: ${process.env.FRONTEND_URL ?? 'https://app.luneo.app'}/monitoring`);
}

run()
  .catch((error) => {
    console.error('❌ Quota reset échoué:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


