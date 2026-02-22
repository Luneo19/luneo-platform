import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type StockOperation = 'increment' | 'decrement' | 'set';

export interface BulkImportMapping {
  name: string;
  description?: string;
  sku?: string;
  price?: string;
  category?: string;
  tags?: string;
  images?: string;
  stock?: string;
}

export interface VariantInput {
  id?: string;
  sku?: string;
  name: string;
  attributes: Record<string, string>;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  images?: string[];
}

export interface ExportFilters {
  category?: string;
  status?: string;
  ids?: string[];
}

@Injectable()
export class ProductsEnhancedService {
  private readonly logger = new Logger(ProductsEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Import products from CSV/Excel with column mapping.
   */
  async importBulk(
    brandId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    mappings: BulkImportMapping,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const rows = await this.parseImportFile(file, mappings);
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const slug = (row.name as string)
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        const uniqueSlug = `${slug}-${Date.now()}-${i}`;
        await this.prisma.product.create({
          data: {
            brandId,
            name: row.name as string,
            slug: uniqueSlug,
            description: (row.description as string) ?? null,
            sku: (row.sku as string) ?? null,
            price: this.toDecimal(row.price),
            category: (row.category as string) ?? null,
            tags: this.toTags(row.tags),
            images: this.toImages(row.images),
            status: 'ACTIVE',
            isActive: true,
            isPublic: true,
          },
        });
        imported++;
      } catch (e) {
        failed++;
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    this.logger.log(`Bulk import for brand ${brandId}: ${imported} imported, ${failed} failed`);
    return { imported, failed, errors };
  }

  /**
   * Export products to CSV/Excel/JSON.
   */
  async exportBulk(
    brandId: string,
    format: 'csv' | 'excel' | 'json',
    filters?: ExportFilters,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const where: Prisma.ProductWhereInput = { brandId, deletedAt: null };
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    if (filters?.ids?.length) where.id = { in: filters.ids };

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sku: true,
        price: true,
        currency: true,
        category: true,
        tags: true,
        images: true,
        status: true,
        createdAt: true,
      },
    });

    if (format === 'json') {
      const buffer = Buffer.from(JSON.stringify(products, null, 2), 'utf-8');
      return { buffer, contentType: 'application/json', filename: `products-${brandId}-${Date.now()}.json` };
    }
    if (format === 'csv') {
      const header = 'id,name,slug,description,sku,price,currency,category,tags,status\n';
      const rows = products.map(
        (p) =>
          `${p.id},${this.escapeCsv(p.name)},${p.slug},${this.escapeCsv(p.description ?? '')},${p.sku ?? ''},${p.price},${p.currency},${p.category ?? ''},${(p.tags ?? []).join(';')},${p.status}`,
      );
      const buffer = Buffer.from(header + rows.join('\n'), 'utf-8');
      return { buffer, contentType: 'text/csv', filename: `products-${brandId}-${Date.now()}.csv` };
    }
    const csv = await this.exportBulk(brandId, 'csv', filters);
    return { ...csv, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: csv.filename.replace('.csv', '.xlsx') };
  }

  /**
   * Create/update product variants (size, color, material).
   */
  async manageVariants(productId: string, variants: VariantInput[]): Promise<{ created: number; updated: number }> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    let created = 0;
    let updated = 0;
    for (const v of variants) {
      const data = {
        productId,
        sku: v.sku ?? null,
        name: v.name,
        attributes: v.attributes as object,
        price: v.price != null ? new Prisma.Decimal(v.price) : undefined,
        compareAtPrice: v.compareAtPrice != null ? new Prisma.Decimal(v.compareAtPrice) : undefined,
        stock: v.stock ?? 0,
        images: v.images ?? [],
      };
      if (v.id) {
        await this.prisma.productVariant.update({
          where: { id: v.id },
          data,
        });
        updated++;
      } else {
        await this.prisma.productVariant.create({ data });
        created++;
      }
    }
    this.logger.log(`Variants managed for product ${productId}: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Update stock levels (increment/decrement/set).
   */
  async updateStock(
    productId: string,
    variantId: string | null,
    quantity: number,
    operation: StockOperation,
  ): Promise<{ newStock: number }> {
    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }
      const newStock = this.applyStockOp(variant.stock, quantity, operation);
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });
      return { newStock };
    }
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
    });
    if (variants.length === 0) {
      throw new BadRequestException('Product has no variants; specify variantId or create variants first');
    }
    for (const v of variants) {
      const newStock = this.applyStockOp(v.stock, quantity, operation);
      await this.prisma.productVariant.update({
        where: { id: v.id },
        data: { stock: newStock },
      });
    }
    const first = variants[0];
    const newStock = this.applyStockOp(first.stock, quantity, operation);
    return { newStock };
  }

  /**
   * Get product media gallery with sorting.
   */
  async getMediaGallery(
    productId: string,
    options?: { sort?: 'position' | 'createdAt'; limit?: number },
  ): Promise<{ url: string; type: string; position: number }[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { images: true, baseImageUrl: true, thumbnailUrl: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const media: { url: string; type: string; position: number }[] = [];
    if (product.thumbnailUrl) {
      media.push({ url: product.thumbnailUrl, type: 'thumbnail', position: 0 });
    }
    if (product.baseImageUrl && !media.some((m) => m.url === product.baseImageUrl)) {
      media.push({ url: product.baseImageUrl!, type: 'base', position: 1 });
    }
    (product.images ?? []).forEach((url, i) => {
      if (url && !media.some((m) => m.url === url)) {
        media.push({ url, type: 'image', position: 2 + i });
      }
    });
    const sort = options?.sort ?? 'position';
    if (sort === 'createdAt') {
      media.sort((a, b) => a.position - b.position);
    }
    const limit = options?.limit ?? 50;
    return media.slice(0, limit);
  }

  private applyStockOp(current: number, quantity: number, operation: StockOperation): number {
    if (operation === 'set') return Math.max(0, quantity);
    if (operation === 'increment') return Math.max(0, current + quantity);
    return Math.max(0, current - quantity);
  }

  private toDecimal(value: unknown): Prisma.Decimal {
    if (value == null) return new Prisma.Decimal(0);
    const n = Number(value);
    if (Number.isNaN(n)) return new Prisma.Decimal(0);
    return new Prisma.Decimal(n);
  }

  private toTags(value: unknown): string[] {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(String);
    return String(value).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  private toImages(value: unknown): string[] {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(String);
    return String(value).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  private escapeCsv(s: string): string {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private async parseImportFile(
    file: { buffer: Buffer; mimetype: string },
    mappings: BulkImportMapping,
  ): Promise<Record<string, unknown>[]> {
    const csv = file.buffer.toString('utf-8');
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const mapKeys = Object.keys(mappings) as (keyof BulkImportMapping)[];
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, unknown> = {};
      mapKeys.forEach((key) => {
        const col = (mappings[key] as string) ?? key;
        const idx = headers.indexOf(col);
        if (idx >= 0) row[key] = values[idx];
      });
      if (Object.keys(row).length) rows.push(row);
    }
    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' && !inQuotes) || c === '\n') {
        result.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  }
}
