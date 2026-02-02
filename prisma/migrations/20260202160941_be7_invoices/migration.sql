-- AlterTable
ALTER TABLE "InvoiceDeliveryLog" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "deadLetteredAt" TIMESTAMP(3),
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "invoiceLinkTtlMinutes" INTEGER NOT NULL DEFAULT 60;
