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

function collectTestsFromSuite(suite, parents = []) {
  const title = suite.title || '';
  const nextParents = title ? [...parents, title] : parents;
  const collected = [];

  const specs = Array.isArray(suite.specs) ? suite.specs : [];
  for (const spec of specs) {
    const specPath = [...nextParents, spec.title].filter(Boolean);
    const tests = Array.isArray(spec.tests) ? spec.tests : [];
    for (const test of tests) {
      const results = Array.isArray(test.results) ? test.results : [];
      const maxDurationMs = results.reduce((max, result) => Math.max(max, result.duration || 0), 0);
      const retriesUsed = Math.max(0, results.length - 1);
      const normalizedStatus =
        test.status === 'expected'
          ? 'passed'
          : test.status === 'unexpected'
            ? 'failed'
            : test.status || 'unknown';
      const flaky = normalizedStatus === 'flaky' || (normalizedStatus === 'passed' && retriesUsed > 0);
      const failed = normalizedStatus === 'failed' || normalizedStatus === 'timedOut' || normalizedStatus === 'interrupted';

      collected.push({
        title: [...specPath, test.projectName || 'default'].filter(Boolean).join(' > '),
        status: normalizedStatus,
        flaky,
        failed,
        skipped: normalizedStatus === 'skipped',
        passed: normalizedStatus === 'passed',
        retriesUsed,
        maxDurationMs,
        errorMessages: results
          .map((result) => result.error?.message)
          .filter(Boolean)
          .slice(0, 2),
      });
    }
  }

  const nestedSuites = Array.isArray(suite.suites) ? suite.suites : [];
  for (const nested of nestedSuites) {
    collected.push(...collectTestsFromSuite(nested, nextParents));
  }

  return collected;
}

function toMarkdown(summary) {
  const slowRows = summary.slowestTests.length
    ? summary.slowestTests
        .map(
          (test, idx) =>
            `${idx + 1}. \`${test.title}\` — ${(test.maxDurationMs / 1000).toFixed(2)}s (\`${test.status}\`)`
        )
        .join('\n')
    : 'Aucun test lent détecté.';

  const failedRows = summary.failedTests.length
    ? summary.failedTests
        .map((test, idx) => `${idx + 1}. \`${test.title}\`${test.errorPreview ? ` — ${test.errorPreview}` : ''}`)
        .join('\n')
    : 'Aucun échec.';

  return [
    '# E2E Stability Report',
    '',
    `- Suite: \`${summary.suite}\``,
    `- Generated at: \`${summary.generatedAt}\``,
    `- Total tests: **${summary.total}**`,
    `- Passed: **${summary.passed}**`,
    `- Failed: **${summary.failed}**`,
    `- Flaky: **${summary.flaky}**`,
    `- Skipped: **${summary.skipped}**`,
    `- Pass rate: **${summary.passRatePct.toFixed(2)}%**`,
    `- Flaky rate: **${summary.flakyRatePct.toFixed(2)}%**`,
    '',
    '## Slowest Tests',
    '',
    slowRows,
    '',
    '## Failed Tests',
    '',
    failedRows,
    '',
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input;
  const outDir = args['out-dir'] || 'artifacts/e2e-stability';
  const suite = args.suite || 'unspecified';

  if (!input) {
    throw new Error('Missing required --input argument');
  }

  const raw = await fs.readFile(path.resolve(input), 'utf8');
  const payload = JSON.parse(raw);
  const suites = Array.isArray(payload.suites) ? payload.suites : [];
  const tests = suites.flatMap((suiteItem) => collectTestsFromSuite(suiteItem));

  const stats = payload.stats || {};
  const total = tests.length || Number(stats.expected || 0) + Number(stats.unexpected || 0) + Number(stats.flaky || 0);
  const passed = tests.length ? tests.filter((test) => test.passed).length : Number(stats.expected || 0);
  const failed = tests.length ? tests.filter((test) => test.failed).length : Number(stats.unexpected || 0);
  const skipped = tests.length ? tests.filter((test) => test.skipped).length : Number(stats.skipped || 0);
  const flaky = tests.length ? tests.filter((test) => test.flaky).length : Number(stats.flaky || 0);

  const slowestTests = [...tests]
    .sort((a, b) => b.maxDurationMs - a.maxDurationMs)
    .slice(0, 10)
    .map((test) => ({ title: test.title, status: test.status, maxDurationMs: test.maxDurationMs }));

  const failedTests = tests
    .filter((test) => test.failed)
    .slice(0, 20)
    .map((test) => ({
      title: test.title,
      status: test.status,
      errorPreview: test.errorMessages[0]?.replace(/\s+/g, ' ').slice(0, 220) || '',
    }));

  const summary = {
    suite,
    generatedAt: new Date().toISOString(),
    total,
    passed,
    failed,
    flaky,
    skipped,
    passRatePct: total ? (passed / total) * 100 : 0,
    flakyRatePct: total ? (flaky / total) * 100 : 0,
    slowestTests,
    failedTests,
  };

  const outputDir = path.resolve(outDir);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, `${suite}-stability-summary.json`), JSON.stringify(summary, null, 2), 'utf8');
  await fs.writeFile(path.join(outputDir, `${suite}-stability-summary.md`), toMarkdown(summary), 'utf8');
  console.log(`E2E stability report generated for suite: ${suite}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
