import { Test, TestingModule } from '@nestjs/testing';
import { WebCrawlerService } from '../web-crawler.service';

describe('WebCrawlerService', () => {
  let service: WebCrawlerService;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebCrawlerService],
    }).compile();

    service = module.get<WebCrawlerService>(WebCrawlerService);
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('normalizeUrl should add https:// when missing', () => {
    const normalized = (service as any).normalizeUrl('example.com/');
    expect(normalized).toBe('https://example.com');
  });

  it('extractData should extract title and meta description from HTML', () => {
    const html = `
      <html lang="fr">
        <head>
          <title>Mon Site Test</title>
          <meta name="description" content="Description de test" />
        </head>
        <body>
          <h1>Bienvenue</h1>
          <p>Contenu principal.</p>
        </body>
      </html>
    `;

    const result = (service as any).extractData('https://example.com', html);

    expect(result.title).toBe('Mon Site Test');
    expect(result.metaDescription).toBe('Description de test');
  });

  it('crawl should return expected CrawlResult structure', async () => {
    const html = `
      <html lang="fr">
        <head>
          <title>Luneo</title>
          <meta name="description" content="Plateforme IA" />
        </head>
        <body>
          <h1>Accueil</h1>
          <p>Contact: hello@luneo.ai</p>
          <a href="https://www.linkedin.com/company/luneo">LinkedIn</a>
        </body>
      </html>
    `;

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue(html),
    });

    const result = await service.crawl('luneo.ai/');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://luneo.ai',
      expect.objectContaining({
        redirect: 'follow',
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('Luneo-Bot'),
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        url: 'https://luneo.ai',
        title: 'Luneo',
        metaDescription: 'Plateforme IA',
        headings: expect.any(Array),
        mainContent: expect.any(String),
        faqItems: expect.any(Array),
        contactInfo: expect.any(Object),
        socialLinks: expect.any(Array),
        products: expect.any(Array),
        services: expect.any(Array),
        brandColors: expect.any(Array),
        language: 'fr',
        crawledAt: expect.any(String),
      }),
    );
  });
});
