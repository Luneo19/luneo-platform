/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const OUT_DIR = path.resolve('artifacts/rollback-drill');
const JSON_REPORT = path.join(OUT_DIR, 'rollback-drill-report.json');
const MD_REPORT = path.join(OUT_DIR, 'rollback-drill-report.md');
const startedAt = new Date();

function runStep(name, command, args, env = process.env) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    env,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return {
    name,
    command: `${command} ${args.join(' ')}`.trim(),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    durationMs: Date.now() - started,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function markdown(report) {
  const lines = [
    '# Rollback Drill Report',
    '',
    `- Started at: ${report.startedAt}`,
    `- Finished at: ${report.finishedAt}`,
    `- Dry run: ${report.dryRun}`,
    `- Overall: ${report.ok ? 'OK' : 'KO'}`,
    '',
    '## Steps',
  ];

  for (const step of report.steps) {
    lines.push(`- ${step.ok ? 'OK' : 'KO'} \`${step.name}\` (${step.durationMs}ms)`);
    lines.push(`  - Command: \`${step.command}\``);
    if (step.stderr) lines.push(`  - stderr: \`${step.stderr.slice(0, 400)}\``);
  }

  return lines.join('\n');
}

async function main() {
  const dryRun = process.env.ROLLBACK_DRILL_DRY_RUN !== 'false';
  const required = [
    'SMOKE_BASE_URL',
    'SMOKE_USER_EMAIL',
    'SMOKE_USER_PASSWORD',
    'SMOKE_ADMIN_EMAIL',
    'SMOKE_ADMIN_PASSWORD',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars for rollback drill: ${missing.join(', ')}`);
  }

  const steps = [];
  steps.push(runStep('pre-rollback-critical-smoke', 'pnpm', ['run', 'smoke:critical']));

  if (dryRun) {
    steps.push({
      name: 'rollback-action',
      command: 'dry-run: no rollback command executed',
      ok: true,
      exitCode: 0,
      durationMs: 0,
      stdout: '',
      stderr: '',
    });
  } else {
    const rollbackCommand = process.env.ROLLBACK_DRILL_COMMAND;
    if (!rollbackCommand) {
      throw new Error('ROLLBACK_DRILL_COMMAND is required when ROLLBACK_DRILL_DRY_RUN=false');
    }

    steps.push(runStep('rollback-action', 'sh', ['-c', rollbackCommand]));
  }

  steps.push(runStep('post-rollback-critical-smoke', 'pnpm', ['run', 'smoke:critical']));
  steps.push(runStep('post-rollback-post-login-smoke', 'pnpm', ['run', 'smoke:post-login-tunnel']));

  const ok = steps.every((step) => step.ok);
  const report = {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    dryRun,
    ok,
    steps,
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(JSON_REPORT, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(MD_REPORT, markdown(report), 'utf8');

  console.log(`Rollback drill report written: ${JSON_REPORT}`);
  console.log(`Rollback drill report written: ${MD_REPORT}`);

  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error(`[rollback:drill] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
