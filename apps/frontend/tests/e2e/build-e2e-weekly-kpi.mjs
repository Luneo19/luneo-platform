import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--') continue;
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

async function readSummary(filePath) {
  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
  return JSON.parse(raw);
}

function weekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const criticalPath = args.critical;
  const domainPath = args.domain;
  const outDir = args['out-dir'] || 'artifacts/e2e';

  if (!criticalPath || !domainPath) {
    throw new Error('Missing required --critical and --domain arguments');
  }

  const [critical, domain] = await Promise.all([readSummary(criticalPath), readSummary(domainPath)]);
  const combinedTotal = critical.total + domain.total;
  const combinedPassed = critical.passed + domain.passed;
  const combinedFailed = critical.failed + domain.failed;
  const combinedFlaky = critical.flaky + domain.flaky;
  const combinedPassRate = combinedTotal ? (combinedPassed / combinedTotal) * 100 : 0;
  const combinedFlakyRate = combinedTotal ? (combinedFlaky / combinedTotal) * 100 : 0;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    week: weekId(),
    gates: {
      critical: {
        total: critical.total,
        passed: critical.passed,
        failed: critical.failed,
        flaky: critical.flaky,
        passRatePct: critical.passRatePct,
        flakyRatePct: critical.flakyRatePct,
      },
      domain: {
        total: domain.total,
        passed: domain.passed,
        failed: domain.failed,
        flaky: domain.flaky,
        passRatePct: domain.passRatePct,
        flakyRatePct: domain.flakyRatePct,
      },
    },
    portfolio: {
      total: combinedTotal,
      passed: combinedPassed,
      failed: combinedFailed,
      flaky: combinedFlaky,
      passRatePct: combinedPassRate,
      flakyRatePct: combinedFlakyRate,
    },
  };

  const md = [
    '# Weekly E2E KPI Snapshot',
    '',
    `- Week: \`${snapshot.week}\``,
    `- Generated at: \`${snapshot.generatedAt}\``,
    '',
    '| Scope | Total | Passed | Failed | Flaky | Pass rate | Flaky rate |',
    '|---|---:|---:|---:|---:|---:|---:|',
    `| Critical | ${critical.total} | ${critical.passed} | ${critical.failed} | ${critical.flaky} | ${critical.passRatePct.toFixed(
      2
    )}% | ${critical.flakyRatePct.toFixed(2)}% |`,
    `| Domain | ${domain.total} | ${domain.passed} | ${domain.failed} | ${domain.flaky} | ${domain.passRatePct.toFixed(
      2
    )}% | ${domain.flakyRatePct.toFixed(2)}% |`,
    `| Portfolio | ${combinedTotal} | ${combinedPassed} | ${combinedFailed} | ${combinedFlaky} | ${combinedPassRate.toFixed(
      2
    )}% | ${combinedFlakyRate.toFixed(2)}% |`,
    '',
  ].join('\n');

  const out = path.resolve(outDir);
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, `weekly-kpi-${snapshot.week}.json`), JSON.stringify(snapshot, null, 2), 'utf8');
  await fs.writeFile(path.join(out, `weekly-kpi-${snapshot.week}.md`), md, 'utf8');
  console.log(`Weekly KPI snapshot generated: ${snapshot.week}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
