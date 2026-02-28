import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SECURITY: Escape HTML entities to prevent XSS injection in email templates.
 * User-supplied values must be escaped before interpolation into HTML.
 */
export function escapeHtml(str: string): string {
  if (str == null || typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Template renderer for externalized email templates.
 * Loads templates from the templates/ directory, caches them in memory,
 * and replaces {{variableName}} with HTML-escaped values.
 */
export class TemplateRenderer {
  private readonly logger = new Logger(TemplateRenderer.name);
  private readonly cache = new Map<string, string>();
  private readonly templatesDir: string;

  constructor() {
    // Resolve templates path - works for both src and dist
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * Get the path to a template file
   */
  private getTemplatePath(templateName: string): string {
    const baseName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
    return path.join(this.templatesDir, baseName);
  }

  private getTemplateCandidates(templateName: string, locale?: string): string[] {
    const normalizedLocale = (locale || '').trim().toLowerCase();
    if (normalizedLocale.startsWith('en')) {
      return [`${templateName}.en`, templateName];
    }
    return [templateName];
  }

  /**
   * Load template from disk (with caching)
   */
  private loadTemplate(templateName: string): string | null {
    const cached = this.cache.get(templateName);
    if (cached) {
      return cached;
    }

    const templatePath = this.getTemplatePath(templateName);
    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      this.cache.set(templateName, content);
      return content;
    } catch (error) {
      this.logger.debug(`Template not found: ${templateName} at ${templatePath}`);
      return null;
    }
  }

  /**
   * Replace {{variableName}} placeholders with escaped values.
   * Supports {{{variableName}}} for raw HTML (use only for trusted content).
   */
  private interpolate(template: string, variables: Record<string, unknown>): string {
    // First handle raw {{{var}}} - no escaping
    let result = template.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
      const value = variables[key];
      if (value == null || value === undefined) {
        return '';
      }
      return String(value);
    });
    // Then handle escaped {{var}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      if (value == null || value === undefined) {
        return '';
      }
      return escapeHtml(String(value));
    });
    return result;
  }

  /**
   * Render a template with the given variables.
   * Returns null if the template file does not exist.
   */
  render(templateName: string, variables: Record<string, unknown>, locale?: string): string | null {
    const candidates = this.getTemplateCandidates(templateName, locale);
    for (const candidate of candidates) {
      const template = this.loadTemplate(candidate);
      if (template) {
        return this.interpolate(template, variables);
      }
    }
    return null;
  }

  /**
   * Check if a template exists
   */
  hasTemplate(templateName: string): boolean {
    return this.loadTemplate(templateName) !== null;
  }

  /**
   * Clear the template cache (useful for testing or hot-reload)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
