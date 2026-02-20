-- AlterTable: Add tax/VAT fields to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clientCountry" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clientType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clientVatNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "amountHt" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "vatRate" DECIMAL(5,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "vatAmount" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "amountTtc" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reverseCharge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

-- CreateIndex: unique invoice number
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex: invoice number lookup
CREATE INDEX IF NOT EXISTS "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateTable: CreditNote for invoice cancellation/refund
CREATE TABLE IF NOT EXISTS "CreditNote" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CreditNote unique credit number
CREATE UNIQUE INDEX IF NOT EXISTS "CreditNote_creditNumber_key" ON "CreditNote"("creditNumber");

-- CreateIndex: CreditNote by invoice
CREATE INDEX IF NOT EXISTS "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
