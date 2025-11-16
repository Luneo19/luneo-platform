import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingTaxService } from './billing-tax.service';
import PDFDocument = require('pdfkit');

export interface InvoiceOptions {
  includeTaxBreakdown?: boolean;
  locale?: string;
}

@Injectable()
export class BillingInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxService: BillingTaxService,
  ) {}

  async generateInvoicePdf(orderId: string, options: InvoiceOptions = {}): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: {
          select: {
            country: true,
            city: true,
          },
        },
        user: true,
        design: true,
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    const tax = this.taxService.computeTax({
      subtotalCents: order.subtotalCents,
      countryCode: order.brand?.country ?? 'FR',
      regionCode: order.brand?.city ?? undefined,
    });

    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const invoiceNumber = order.orderNumber ?? `INV-${order.id}`;
    const issueDate = new Date(order.createdAt).toLocaleDateString(options.locale ?? 'fr-FR');

    doc.fontSize(20).text(`Facture ${invoiceNumber}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text('Luneo Platform', 50, 80);
    doc.text('support@luneo.app');
    doc.text('https://luneo.app');

    doc.moveDown();
    doc.text(`Émise le ${issueDate}`);
    doc.text(`Client : ${order.customerName ?? order.user?.name ?? 'N/A'}`);
    doc.text(`Email : ${order.customerEmail ?? order.user?.email ?? 'N/A'}`);

    doc.moveDown();
    doc.fontSize(14).text('Détail', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);

    doc.text(`Produit : ${order.product?.name ?? 'Personnalisation IA'}`);
    doc.text(`Design : ${order.design?.prompt ?? 'N/A'}`);
    doc.text('Quantité : 1');

    doc.moveDown();
    doc.fontSize(12).text('Résumé financier', { underline: true });
    doc.moveDown(0.5);

    const formatAmount = (cents: number) => `${(cents / 100).toFixed(2)} ${tax.currency}`;

    doc.text(`Sous-total : ${formatAmount(order.subtotalCents)}`);
    if (options.includeTaxBreakdown !== false) {
      doc.text(`TVA (${(tax.taxRate * 100).toFixed(2)} %) : ${formatAmount(tax.taxCents)}`);
    }
    doc.text(`Total : ${formatAmount(tax.totalCents)}`, { underline: true });

    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text('Merci pour votre confiance.', { align: 'center' });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}

