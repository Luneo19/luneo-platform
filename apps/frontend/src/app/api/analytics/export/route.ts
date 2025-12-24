/**
 * Analytics Export API
 * A-008: Export CSV/PDF des rapports analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf']),
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'custom']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  reportType: z.enum(['overview', 'funnel', 'products', 'audience', 'full']).default('full'),
});

// Mock data generator
function generateMockData(dateRange: string, reportType: string) {
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
  
  const dailyData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(300 + Math.random() * 200),
      pageViews: Math.floor(800 + Math.random() * 400),
      conversions: Math.floor(20 + Math.random() * 30),
      revenue: Math.floor(1000 + Math.random() * 2000),
      designs: Math.floor(50 + Math.random() * 50),
      avgSessionDuration: Math.floor(180 + Math.random() * 120),
    };
  });

  const funnelData = [
    { step: 'Visiteurs', value: 10000, rate: 100 },
    { step: 'Vues Produits', value: 6500, rate: 65 },
    { step: 'Personnalisations', value: 3200, rate: 32 },
    { step: 'Ajout Panier', value: 1800, rate: 18 },
    { step: 'Achats', value: 850, rate: 8.5 },
  ];

  const topProducts = [
    { product: 'T-Shirt Premium', designs: 1234, revenue: 36820, conversionRate: 4.3 },
    { product: 'Mug Personnalisé', designs: 987, revenue: 14805, conversionRate: 3.8 },
    { product: 'Poster A2', designs: 756, revenue: 15107, conversionRate: 5.1 },
    { product: 'Casquette', designs: 543, revenue: 16290, conversionRate: 4.7 },
    { product: 'Tote Bag', designs: 432, revenue: 8640, conversionRate: 3.2 },
  ];

  const audienceData = {
    devices: [
      { device: 'Desktop', percentage: 58 },
      { device: 'Mobile', percentage: 35 },
      { device: 'Tablet', percentage: 7 },
    ],
    countries: [
      { country: 'France', visitors: 5200 },
      { country: 'Belgique', visitors: 1800 },
      { country: 'Suisse', visitors: 1200 },
      { country: 'Canada', visitors: 900 },
      { country: 'Autres', visitors: 900 },
    ],
  };

  if (reportType === 'funnel') return { funnelData };
  if (reportType === 'products') return { topProducts };
  if (reportType === 'audience') return { audienceData };
  if (reportType === 'overview') return { dailyData };
  
  return { dailyData, funnelData, topProducts, audienceData };
}

// CSV Generator
function generateCSV(data: any, reportType: string): string {
  let csv = '';

  if (data.dailyData) {
    csv += 'DAILY METRICS\n';
    csv += 'Date,Visitors,Page Views,Conversions,Revenue (€),Designs,Avg Session (s)\n';
    data.dailyData.forEach((row: any) => {
      csv += `${row.date},${row.visitors},${row.pageViews},${row.conversions},${row.revenue},${row.designs},${row.avgSessionDuration}\n`;
    });
    csv += '\n';
  }

  if (data.funnelData) {
    csv += 'CONVERSION FUNNEL\n';
    csv += 'Step,Value,Rate (%)\n';
    data.funnelData.forEach((row: any) => {
      csv += `${row.step},${row.value},${row.rate}\n`;
    });
    csv += '\n';
  }

  if (data.topProducts) {
    csv += 'TOP PRODUCTS\n';
    csv += 'Product,Designs,Revenue (€),Conversion Rate (%)\n';
    data.topProducts.forEach((row: any) => {
      csv += `${row.product},${row.designs},${row.revenue},${row.conversionRate}\n`;
    });
    csv += '\n';
  }

  if (data.audienceData) {
    csv += 'DEVICES\n';
    csv += 'Device,Percentage (%)\n';
    data.audienceData.devices.forEach((row: any) => {
      csv += `${row.device},${row.percentage}\n`;
    });
    csv += '\n';

    csv += 'COUNTRIES\n';
    csv += 'Country,Visitors\n';
    data.audienceData.countries.forEach((row: any) => {
      csv += `${row.country},${row.visitors}\n`;
    });
  }

  return csv;
}

// Generate PDF HTML (will be converted client-side)
function generatePDFHTML(data: any, dateRange: string): string {
  const reportDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Analytics Luneo</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #475569; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .date { color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .metric-card { display: inline-block; padding: 20px; background: #f8fafc; border-radius: 8px; margin: 10px; min-width: 150px; }
        .metric-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
        .metric-label { color: #64748b; font-size: 14px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">📊 Luneo Analytics</div>
        <div class="date">Généré le ${reportDate}</div>
      </div>
      
      <h1>Rapport Analytics - ${dateRange === '7d' ? '7 derniers jours' : dateRange === '30d' ? '30 derniers jours' : dateRange === '90d' ? '90 derniers jours' : 'Année'}</h1>
      
      ${data.dailyData ? `
        <h2>📈 Métriques Clés</h2>
        <div>
          <div class="metric-card">
            <div class="metric-value">${data.dailyData.reduce((acc: number, d: any) => acc + d.visitors, 0).toLocaleString()}</div>
            <div class="metric-label">Visiteurs</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.dailyData.reduce((acc: number, d: any) => acc + d.conversions, 0).toLocaleString()}</div>
            <div class="metric-label">Conversions</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">€${data.dailyData.reduce((acc: number, d: any) => acc + d.revenue, 0).toLocaleString()}</div>
            <div class="metric-label">Revenu Total</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.dailyData.reduce((acc: number, d: any) => acc + d.designs, 0).toLocaleString()}</div>
            <div class="metric-label">Designs</div>
          </div>
        </div>
      ` : ''}
      
      ${data.funnelData ? `
        <h2>🎯 Funnel de Conversion</h2>
        <table>
          <tr><th>Étape</th><th>Visiteurs</th><th>Taux</th></tr>
          ${data.funnelData.map((step: any) => `
            <tr><td>${step.step}</td><td>${step.value.toLocaleString()}</td><td>${step.rate}%</td></tr>
          `).join('')}
        </table>
      ` : ''}
      
      ${data.topProducts ? `
        <h2>🏆 Top Produits</h2>
        <table>
          <tr><th>Produit</th><th>Designs</th><th>Revenu</th><th>Conv. Rate</th></tr>
          ${data.topProducts.map((p: any) => `
            <tr><td>${p.product}</td><td>${p.designs}</td><td>€${p.revenue.toLocaleString()}</td><td>${p.conversionRate}%</td></tr>
          `).join('')}
        </table>
      ` : ''}
      
      ${data.audienceData ? `
        <h2>👥 Audience</h2>
        <h3>Par Appareil</h3>
        <table>
          <tr><th>Appareil</th><th>Pourcentage</th></tr>
          ${data.audienceData.devices.map((d: any) => `
            <tr><td>${d.device}</td><td>${d.percentage}%</td></tr>
          `).join('')}
        </table>
        <h3>Par Pays</h3>
        <table>
          <tr><th>Pays</th><th>Visiteurs</th></tr>
          ${data.audienceData.countries.map((c: any) => `
            <tr><td>${c.country}</td><td>${c.visitors.toLocaleString()}</td></tr>
          `).join('')}
        </table>
      ` : ''}
      
      <div class="footer">
        <p>Rapport généré par Luneo Platform - © ${new Date().getFullYear()}</p>
        <p>Ce rapport est confidentiel et destiné à un usage interne uniquement.</p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = exportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { format, dateRange, reportType } = validation.data;
    
    // Generate data
    const data = generateMockData(dateRange, reportType);
    
    logger.info('Analytics export requested', { format, dateRange, reportType });

    // Handle different formats
    if (format === 'csv') {
      const csv = generateCSV(data, reportType);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=luneo-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          exportDate: new Date().toISOString(),
          dateRange,
          reportType,
          ...data,
        },
      });
    }

    if (format === 'pdf') {
      // Return HTML that client will convert to PDF
      const html = generatePDFHTML(data, dateRange);
      return NextResponse.json({
        success: true,
        html,
        filename: `luneo-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Format non supporté' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Analytics export error', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}
