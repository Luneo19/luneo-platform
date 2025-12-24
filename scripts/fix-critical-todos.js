#!/usr/bin/env node

/**
 * Script pour analyser et corriger les TODOs critiques
 * Identifie les @ts-ignore, TODOs, FIXMEs et génère un rapport
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_SRC = path.join(__dirname, '../apps/backend/src');
const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

const issues = {
  tsIgnore: [],
  todos: [],
  fixmes: [],
  anyTypes: [],
};

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // @ts-ignore
    if (line.includes('@ts-ignore') || line.includes('@ts-expect-error')) {
      issues.tsIgnore.push({
        file: relativePath,
        line: lineNum,
        code: line.trim(),
        context: lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n'),
      });
    }

    // TODO
    if (line.match(/TODO[:\-]?\d*|TODO[:\-]?\s/)) {
      issues.todos.push({
        file: relativePath,
        line: lineNum,
        code: line.trim(),
        priority: line.includes('CRITICAL') || line.includes('URGENT') ? 'high' : 'medium',
      });
    }

    // FIXME
    if (line.includes('FIXME')) {
      issues.fixmes.push({
        file: relativePath,
        line: lineNum,
        code: line.trim(),
      });
    }

    // any types
    if (line.match(/\bany\b/) && !line.includes('//')) {
      issues.anyTypes.push({
        file: relativePath,
        line: lineNum,
        code: line.trim(),
      });
    }
  });
}

console.log('🔍 Scanning codebase for critical issues...\n');

const backendFiles = scanDirectory(BACKEND_SRC);
const frontendFiles = scanDirectory(FRONTEND_SRC);

[...backendFiles, ...frontendFiles].forEach(analyzeFile);

console.log('📊 Analysis Results:\n');
console.log(`  @ts-ignore/@ts-expect-error: ${issues.tsIgnore.length}`);
console.log(`  TODOs: ${issues.todos.length}`);
console.log(`  FIXMEs: ${issues.fixmes.length}`);
console.log(`  any types: ${issues.anyTypes.length}\n`);

// Generate report
const report = {
  summary: {
    total: issues.tsIgnore.length + issues.todos.length + issues.fixmes.length + issues.anyTypes.length,
    tsIgnore: issues.tsIgnore.length,
    todos: issues.todos.length,
    fixmes: issues.fixmes.length,
    anyTypes: issues.anyTypes.length,
  },
  issues,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(__dirname, '../CRITICAL_TODOS_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Report generated: CRITICAL_TODOS_REPORT.json\n');

// Show critical issues
if (issues.tsIgnore.length > 0) {
  console.log('🔴 Critical @ts-ignore issues:');
  issues.tsIgnore.slice(0, 10).forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`);
  });
  if (issues.tsIgnore.length > 10) {
    console.log(`  ... and ${issues.tsIgnore.length - 10} more`);
  }
  console.log();
}

if (issues.todos.filter(t => t.priority === 'high').length > 0) {
  console.log('⚠️  High priority TODOs:');
  issues.todos.filter(t => t.priority === 'high').slice(0, 10).forEach(issue => {
    console.log(`  ${issue.file}:${issue.line} - ${issue.code.substring(0, 60)}`);
  });
  console.log();
}

