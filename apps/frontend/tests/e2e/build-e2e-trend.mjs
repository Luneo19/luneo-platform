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

async function readJson(filePath) {
  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
  return JSON.parse(raw);
}

function delta(current, previous) {
  return Number((current - previous).toFixed(2));
}

function formatDelta(value, suffix = '') {
  if (value === null || Number.isNaN(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}${suffix}`;
}

function normalizeScopes(payload) {
  if (payload?.gates && payload?.portfolio) {
    return {
      critical: payload.gates.critical,
      domain: payload.gates.domain,
      portfolio: payload.portfolio,
    };
  }

  // Fallback for single-suite stability summary.
  const single = {
    total: Number(payload.total || 0),
    passed: Number(payload.passed || 0),
    failed: Number(payload.failed || 0),
    flaky: Number(payload.flaky || 0),
    passRatePct: Number(payload.passRatePct || 0),
    flakyRatePct: Number(payload.flakyRatePct || 0),
  };

  return {
    critical: single,
    domain: single,
    portfolio: single,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const currentPath = args.current;
  const previousPath = args.previous;
  const out = args.out || 'artifacts/e2e/e2e-trend.md';

  if (!currentPath) {
    throw new Error('Missing required --current argument');
  }

  const current = await readJson(currentPath);
  let previous = null;
  if (previousPath) {
    try {
      previous = await readJson(previousPath);
    } catch {
      previous = null;
    }
  }

  const currentScopes = normalizeScopes(current);
  const previousScopes = previous ? normalizeScopes(previous) : null;
  const sections = [];
  const scopes = ['critical', 'domain', 'portfolio'];
  const trend = {
    generatedAt: new Date().toISOString(),
    hasBaseline: Boolean(previous),
    scopes: {},
  };

  for (const scope of scopes) {
    const currentScope = currentScopes[scope];
    const previousScope = previousScopes ? previousScopes[scope] : null;

    const passRateDelta = previousScope ? delta(currentScope.passRatePct, previousScope.passRatePct) : null;
    const flakyRateDelta = previousScope ? delta(currentScope.flakyRatePct, previousScope.flakyRatePct) : null;
    const failedDelta = previousScope ? currentScope.failed - previousScope.failed : null;

    trend.scopes[scope] = {
      passRateDelta,
      flakyRateDelta,
      failedDelta,
      current: currentScope,
      previous: previousScope,
    };

    sections.push(
      `### ${scope[0].toUpperCase()}${scope.slice(1)}`,
      `- Pass rate: ${currentScope.passRatePct.toFixed(2)}% (${formatDelta(passRateDelta, '%')})`,
      `- Flaky rate: ${currentScope.flakyRatePct.toFixed(2)}% (${formatDelta(flakyRateDelta, '%')})`,
      `- Failed tests: ${currentScope.failed} (${failedDelta === null ? 'N/A' : `${failedDelta > 0 ? '+' : ''}${failedDelta}`})`,
      ''
    );
  }

  const md = [
    '# E2E Trend (N vs N-1)',
    '',
    `- Generated at: \`${trend.generatedAt}\``,
    `- Baseline available: **${trend.hasBaseline ? 'YES' : 'NO'}**`,
    '',
    ...sections,
  ].join('\n');

  const outPath = path.resolve(out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md, 'utf8');
  await fs.writeFile(outPath.replace(/\.md$/, '.json'), JSON.stringify(trend, null, 2), 'utf8');
  console.log(`E2E trend report generated: ${outPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
