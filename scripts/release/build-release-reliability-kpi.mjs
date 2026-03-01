/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve(process.env.RELEASE_KPI_OUT_DIR || 'artifacts/release-kpi');
const CRITICAL_SMOKE_PATH = path.resolve(
  process.env.CRITICAL_SMOKE_REPORT || 'artifacts/smoke/critical-smoke-report.json'
);
const ROLLBACK_DRILL_PATH = path.resolve(
  process.env.ROLLBACK_DRILL_REPORT || 'artifacts/rollback-drill/rollback-drill-report.json'
);
const JSON_OUT = path.join(OUT_DIR, 'release-reliability-kpi.json');
const MD_OUT = path.join(OUT_DIR, 'release-reliability-kpi.md');

async function readJsonOrNull(targetPath) {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function computeMttrMs(rollbackReport) {
  if (!rollbackReport?.steps || !Array.isArray(rollbackReport.steps)) return null;
  const failed = rollbackReport.steps.find((step) => !step.ok);
  if (!failed) return 0;
  return numberOrNull(failed.durationMs);
}

function toMarkdown(report) {
  const lines = [
    '# Release Reliability KPI',
    '',
    `- Generated at: ${report.generatedAt}`,
    `- Smoke pass-rate: ${report.smoke.passRate === null ? 'N/A' : `${report.smoke.passRate}%`}`,
    `- Rollback success-rate: ${report.rollback.successRate === null ? 'N/A' : `${report.rollback.successRate}%`}`,
    `- MTTR (proxy): ${report.mttrMs === null ? 'N/A' : `${report.mttrMs}ms`}`,
    '',
    '## Sources',
    `- Critical smoke report: ${report.sources.criticalSmokeFound ? 'found' : 'missing'}`,
    `- Rollback drill report: ${report.sources.rollbackReportFound ? 'found' : 'missing'}`,
  ];
  return lines.join('\n');
}

async function main() {
  const [criticalSmoke, rollbackReport] = await Promise.all([
    readJsonOrNull(CRITICAL_SMOKE_PATH),
    readJsonOrNull(ROLLBACK_DRILL_PATH),
  ]);

  const smokePassRate = numberOrNull(criticalSmoke?.passRate);
  const rollbackSuccessRate =
    rollbackReport && typeof rollbackReport.ok === 'boolean' ? (rollbackReport.ok ? 100 : 0) : null;
  const mttrMs = computeMttrMs(rollbackReport);

  const report = {
    generatedAt: new Date().toISOString(),
    smoke: {
      passRate: smokePassRate,
    },
    rollback: {
      successRate: rollbackSuccessRate,
    },
    mttrMs,
    sources: {
      criticalSmokePath: CRITICAL_SMOKE_PATH,
      rollbackReportPath: ROLLBACK_DRILL_PATH,
      criticalSmokeFound: Boolean(criticalSmoke),
      rollbackReportFound: Boolean(rollbackReport),
    },
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(JSON_OUT, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(MD_OUT, toMarkdown(report), 'utf8');

  console.log(`Release reliability KPI written: ${JSON_OUT}`);
  console.log(`Release reliability KPI written: ${MD_OUT}`);
}

main().catch((error) => {
  console.error(`[release:kpi] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
