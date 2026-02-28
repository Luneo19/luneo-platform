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

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input;
  const suite = args.suite || 'unspecified';
  const maxFailed = toNumber(args['max-failed'], 0);
  const maxFlakyRate = toNumber(args['max-flaky-rate'], 0);
  const minPassRate = toNumber(args['min-pass-rate'], 100);

  if (!input) {
    throw new Error('Missing required --input argument');
  }

  const raw = await fs.readFile(path.resolve(input), 'utf8');
  const summary = JSON.parse(raw);

  const failed = Number(summary.failed || 0);
  const flakyRatePct = Number(summary.flakyRatePct || 0);
  const passRatePct = Number(summary.passRatePct || 0);

  const violations = [];
  if (failed > maxFailed) {
    violations.push(`failed tests ${failed} > allowed ${maxFailed}`);
  }
  if (flakyRatePct > maxFlakyRate) {
    violations.push(`flaky rate ${flakyRatePct.toFixed(2)}% > allowed ${maxFlakyRate.toFixed(2)}%`);
  }
  if (passRatePct < minPassRate) {
    violations.push(`pass rate ${passRatePct.toFixed(2)}% < required ${minPassRate.toFixed(2)}%`);
  }

  if (violations.length > 0) {
    throw new Error(`[${suite}] E2E quality gate failed: ${violations.join(' | ')}`);
  }

  console.log(
    `[${suite}] E2E thresholds satisfied (failed=${failed}, flaky=${flakyRatePct.toFixed(2)}%, pass=${passRatePct.toFixed(2)}%)`
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
