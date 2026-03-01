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

function gateStatus(summary, minPassRate, maxFlakyRate, maxFailed) {
  if (summary.failed > maxFailed) return 'FAIL';
  if (summary.flakyRatePct > maxFlakyRate) return 'FAIL';
  if (summary.passRatePct < minPassRate) return 'FAIL';
  return 'PASS';
}

function formatSlowTests(summary) {
  const slow = Array.isArray(summary.slowestTests) ? summary.slowestTests : [];
  if (!slow.length) return '- Aucun test lent';
  return slow
    .slice(0, 5)
    .map((test) => `- \`${test.title}\` (${(test.maxDurationMs / 1000).toFixed(2)}s, ${test.status})`)
    .join('\n');
}

function formatFailedTests(summary) {
  const failed = Array.isArray(summary.failedTests) ? summary.failedTests : [];
  if (!failed.length) return '- Aucun échec';
  return failed
    .slice(0, 5)
    .map((test) => `- \`${test.title}\`${test.errorPreview ? ` — ${test.errorPreview}` : ''}`)
    .join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const criticalPath = args.critical;
  const domainPath = args.domain;
  const outPath = args.out || 'artifacts/e2e/e2e-pr-pack.md';
  const title = args.title || 'E2E PR Quality Pack';

  if (!criticalPath || !domainPath) {
    throw new Error('Missing required --critical and --domain arguments');
  }

  const [critical, domain] = await Promise.all([readSummary(criticalPath), readSummary(domainPath)]);
  const criticalStatus = gateStatus(critical, 100, 0, 0);
  const domainStatus = gateStatus(domain, 99, 1, 0);

  const md = [
    `# ${title}`,
    '',
    `- Generated at: \`${new Date().toISOString()}\``,
    `- Critical gate: **${criticalStatus}**`,
    `- Domain gate: **${domainStatus}**`,
    '',
    '## Gate KPIs',
    '',
    `| Gate | Total | Passed | Failed | Flaky | Pass rate | Flaky rate |`,
    `|---|---:|---:|---:|---:|---:|---:|`,
    `| Critical | ${critical.total} | ${critical.passed} | ${critical.failed} | ${critical.flaky} | ${critical.passRatePct.toFixed(
      2
    )}% | ${critical.flakyRatePct.toFixed(2)}% |`,
    `| Domain | ${domain.total} | ${domain.passed} | ${domain.failed} | ${domain.flaky} | ${domain.passRatePct.toFixed(
      2
    )}% | ${domain.flakyRatePct.toFixed(2)}% |`,
    '',
    '## Top Slow Tests',
    '',
    '### Critical',
    formatSlowTests(critical),
    '',
    '### Domain',
    formatSlowTests(domain),
    '',
    '## Failures (if any)',
    '',
    '### Critical',
    formatFailedTests(critical),
    '',
    '### Domain',
    formatFailedTests(domain),
    '',
    '## Release Recommendation',
    '',
    criticalStatus === 'PASS' && domainStatus === 'PASS'
      ? '- Recommendation: **GO** (quality gates passed).'
      : '- Recommendation: **NO-GO** (at least one gate failed).',
    '',
  ].join('\n');

  await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  await fs.writeFile(path.resolve(outPath), md, 'utf8');
  console.log(`PR pack generated: ${outPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
