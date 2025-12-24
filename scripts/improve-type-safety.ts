#!/usr/bin/env ts-node

/**
 * Script pour améliorer progressivement le type safety
 * Analyse les usages de 'any' et suggère des remplacements
 */

import * as fs from 'fs';
import * as path from 'path';

interface AnyUsage {
  file: string;
  line: number;
  code: string;
  type: 'parameter' | 'return' | 'variable' | 'property' | 'cast' | 'generic';
  suggestion?: string;
}

const BACKEND_SRC = path.join(__dirname, '../apps/backend/src');
const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

function findAnyUsages(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAnyUsages(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeFile(filePath: string): AnyUsage[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  const usages: AnyUsage[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Parameter: function(param: any)
    if (/\w+\s*:\s*any\b/.test(trimmed) && trimmed.includes('(')) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'parameter',
        suggestion: 'Replace with specific type or use generic type parameter',
      });
    }
    // Return type: function(): any
    else if (/:\s*any\s*[={]/.test(trimmed) && trimmed.includes('=>')) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'return',
        suggestion: 'Replace with specific return type',
      });
    }
    // Variable: const x: any
    else if (/const\s+\w+\s*:\s*any/.test(trimmed)) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'variable',
        suggestion: 'Replace with specific type or infer from value',
      });
    }
    // Property: { prop: any }
    else if (/\w+\s*:\s*any/.test(trimmed) && trimmed.includes('{')) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'property',
        suggestion: 'Replace with specific type or use JsonValue',
      });
    }
    // Cast: as any
    else if (/\bas\s+any\b/.test(trimmed)) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'cast',
        suggestion: 'Use proper type assertion or fix underlying type issue',
      });
    }
    // Generic: Array<any>, Record<string, any>
    else if (/Array<any>|Record<.*any.*>/.test(trimmed)) {
      usages.push({
        file: relativePath,
        line: lineNum,
        code: trimmed,
        type: 'generic',
        suggestion: 'Replace with specific generic type or use JsonValue',
      });
    }
  });

  return usages;
}

function generateReport(usages: AnyUsage[]): void {
  const report = {
    summary: {
      total: usages.length,
      byType: usages.reduce((acc, usage) => {
        acc[usage.type] = (acc[usage.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byFile: usages.reduce((acc, usage) => {
        acc[usage.file] = (acc[usage.file] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    usages: usages.slice(0, 100), // Limit to first 100 for readability
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, '../TYPE_SAFETY_REPORT.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('📊 Type Safety Analysis Report:');
  console.log(`  Total 'any' usages: ${usages.length}`);
  console.log('\n  By type:');
  Object.entries(report.summary.byType).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });
  console.log('\n  Top 10 files:');
  Object.entries(report.summary.byFile)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`    ${file}: ${count}`);
    });
}

// Main
const backendFiles = findAnyUsages(BACKEND_SRC);
const frontendFiles = findAnyUsages(FRONTEND_SRC);

console.log('🔍 Analyzing type safety...\n');
console.log(`  Backend files: ${backendFiles.length}`);
console.log(`  Frontend files: ${frontendFiles.length}\n`);

const allUsages: AnyUsage[] = [];

[...backendFiles, ...frontendFiles].forEach(file => {
  const usages = analyzeFile(file);
  allUsages.push(...usages);
});

generateReport(allUsages);
console.log('\n✅ Report generated: TYPE_SAFETY_REPORT.json');

