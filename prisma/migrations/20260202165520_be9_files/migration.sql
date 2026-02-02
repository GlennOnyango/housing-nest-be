-- AlterTable
ALTER TABLE "FileAsset" ADD COLUMN     "virusScanStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "virusScannedAt" TIMESTAMP(3);
