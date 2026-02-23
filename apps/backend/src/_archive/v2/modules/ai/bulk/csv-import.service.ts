import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class CSVImportService {
  private readonly logger = new Logger(CSVImportService.name);

  parseCSV(csvContent: string): Record<string, string>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) throw new BadRequestException('CSV must have a header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    if (headers.length === 0) throw new BadRequestException('No headers found in CSV');

    const results: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length !== headers.length) {
        this.logger.warn(`Skipping row ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
        continue;
      }
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      results.push(row);
    }

    if (results.length === 0) throw new BadRequestException('No valid data rows found in CSV');
    if (results.length > 1000) throw new BadRequestException('Maximum 1000 rows allowed');
    return results;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += char;
    }
    result.push(current.trim());
    return result;
  }

  validateVariables(template: string, variables: Record<string, string>[]): { valid: boolean; missingKeys: string[] } {
    const templateVars = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    if (templateVars.length === 0) return { valid: true, missingKeys: [] };
    const firstRow = variables[0];
    const missingKeys = templateVars.filter(v => !(v in firstRow));
    return { valid: missingKeys.length === 0, missingKeys };
  }
}
