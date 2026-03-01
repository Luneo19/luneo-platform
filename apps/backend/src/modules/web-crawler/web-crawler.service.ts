import { Injectable, Logger } from '@nestjs/common';

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  mainContent: string;
  faqItems: { question: string; answer: string }[];
  contactInfo: { email?: string; phone?: string; address?: string };
  socialLinks: string[];
  products: string[];
  services: string[];
  brandColors: string[];
  logoUrl?: string;
  language: string;
  industry?: string;
  crawledAt: string;
}

@Injectable()
export class WebCrawlerService {
  private readonly logger = new Logger(WebCrawlerService.name);

  async crawl(url: string): Promise<CrawlResult> {
    const normalizedUrl = this.normalizeUrl(url);
    this.logger.log(`Crawling ${normalizedUrl}`);

    const html = await this.fetchPage(normalizedUrl);
    return this.extractData(normalizedUrl, html);
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  private async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Luneo-Bot/1.0 (AI Agent Platform; +https://luneo.ai)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractData(url: string, html: string): CrawlResult {
    const title = this.extractBetween(html, '<title>', '</title>') ?? '';
    const metaDescription = this.extractMetaContent(html, 'description') ?? '';
    const headings = this.extractAllBetween(html, /<h[1-3][^>]*>/gi, /<\/h[1-3]>/gi);
    const mainContent = this.extractTextContent(html);
    const faqItems = this.extractFAQ(html);
    const contactInfo = this.extractContactInfo(html, mainContent);
    const socialLinks = this.extractSocialLinks(html);
    const language = this.extractMetaContent(html, 'language')
      ?? this.extractLangAttribute(html)
      ?? 'fr';

    return {
      url,
      title: this.cleanText(title),
      metaDescription: this.cleanText(metaDescription),
      headings: headings.map((h) => this.cleanText(h)).filter(Boolean).slice(0, 30),
      mainContent: mainContent.slice(0, 8000),
      faqItems: faqItems.slice(0, 20),
      contactInfo,
      socialLinks,
      products: this.extractListItems(html, /produit|product|service|solution/i),
      services: this.extractListItems(html, /service|prestation|offre|offer/i),
      brandColors: this.extractBrandColors(html),
      logoUrl: this.extractLogoUrl(html, url),
      language,
      crawledAt: new Date().toISOString(),
    };
  }

  private extractBetween(html: string, start: string, end: string): string | null {
    const s = html.toLowerCase().indexOf(start.toLowerCase());
    if (s === -1) return null;
    const e = html.toLowerCase().indexOf(end.toLowerCase(), s + start.length);
    if (e === -1) return null;
    return html.substring(s + start.length, e);
  }

  private extractMetaContent(html: string, name: string): string | null {
    const regex = new RegExp(
      `<meta[^>]*(?:name|property)=["'](?:og:)?${name}["'][^>]*content=["']([^"']*)["']`,
      'i',
    );
    const match = regex.exec(html);
    if (match) return match[1];

    const regex2 = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["'](?:og:)?${name}["']`,
      'i',
    );
    const match2 = regex2.exec(html);
    return match2 ? match2[1] : null;
  }

  private extractLangAttribute(html: string): string | null {
    const match = /<html[^>]*lang=["']([^"']+)["']/i.exec(html);
    return match ? match[1].split('-')[0] : null;
  }

  private extractAllBetween(html: string, openRegex: RegExp, closeRegex: RegExp): string[] {
    const results: string[] = [];
    let match: RegExpExecArray | null;
    const openMatches: number[] = [];

    while ((match = openRegex.exec(html)) !== null) {
      openMatches.push(match.index + match[0].length);
    }

    for (const start of openMatches) {
      closeRegex.lastIndex = start;
      const closeMatch = closeRegex.exec(html);
      if (closeMatch) {
        results.push(html.substring(start, closeMatch.index));
      }
    }

    return results;
  }

  private extractTextContent(html: string): string {
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#?\w+;/g, ' ');

    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  private extractFAQ(html: string): { question: string; answer: string }[] {
    const faqs: { question: string; answer: string }[] = [];

    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const tag of jsonLdMatch) {
        try {
          const content = tag.replace(/<\/?script[^>]*>/gi, '');
          const data = JSON.parse(content);
          if (data['@type'] === 'FAQPage' && Array.isArray(data.mainEntity)) {
            for (const item of data.mainEntity) {
              if (item.name && item.acceptedAnswer?.text) {
                faqs.push({
                  question: this.cleanText(item.name),
                  answer: this.cleanText(item.acceptedAnswer.text),
                });
              }
            }
          }
        } catch {
          // skip invalid JSON-LD
        }
      }
    }

    const dtDdRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    let dtMatch: RegExpExecArray | null;
    while ((dtMatch = dtDdRegex.exec(html)) !== null) {
      const q = this.cleanText(dtMatch[1].replace(/<[^>]+>/g, ''));
      const a = this.cleanText(dtMatch[2].replace(/<[^>]+>/g, ''));
      if (q && a) faqs.push({ question: q, answer: a });
    }

    return faqs;
  }

  private extractContactInfo(html: string, text: string): { email?: string; phone?: string; address?: string } {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/);

    return {
      email: emailMatch?.[0],
      phone: phoneMatch?.[0]?.trim(),
    };
  }

  private extractSocialLinks(html: string): string[] {
    const socialPatterns = [
      /https?:\/\/(www\.)?facebook\.com\/[^\s"'<]+/gi,
      /https?:\/\/(www\.)?twitter\.com\/[^\s"'<]+/gi,
      /https?:\/\/(www\.)?x\.com\/[^\s"'<]+/gi,
      /https?:\/\/(www\.)?linkedin\.com\/[^\s"'<]+/gi,
      /https?:\/\/(www\.)?instagram\.com\/[^\s"'<]+/gi,
    ];

    const links = new Set<string>();
    for (const pattern of socialPatterns) {
      const matches = html.match(pattern);
      if (matches) matches.forEach((m) => links.add(m.replace(/["'>]$/, '')));
    }
    return Array.from(links);
  }

  private extractListItems(html: string, contextPattern: RegExp): string[] {
    const items: string[] = [];
    const sections = html.split(/<(?:section|div|article)[^>]*>/gi);

    for (const section of sections) {
      if (!contextPattern.test(section)) continue;

      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let match: RegExpExecArray | null;
      while ((match = liRegex.exec(section)) !== null && items.length < 15) {
        const text = this.cleanText(match[1].replace(/<[^>]+>/g, ''));
        if (text && text.length > 3 && text.length < 200) items.push(text);
      }
    }

    return items;
  }

  private extractBrandColors(html: string): string[] {
    const colors = new Set<string>();
    const cssVarMatch = html.match(/--(?:primary|brand|main|accent)[^:]*:\s*([^;]+)/gi);
    if (cssVarMatch) {
      for (const match of cssVarMatch) {
        const value = match.split(':')[1]?.trim();
        if (value) colors.add(value);
      }
    }
    return Array.from(colors).slice(0, 5);
  }

  private extractLogoUrl(html: string, baseUrl: string): string | undefined {
    const ogImage = this.extractMetaContent(html, 'image');
    if (ogImage) {
      return ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
    }

    const logoMatch = html.match(/<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (logoMatch?.[1]) {
      return logoMatch[1].startsWith('http') ? logoMatch[1] : `${baseUrl}${logoMatch[1]}`;
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
