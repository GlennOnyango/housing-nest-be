-- AlterTable
ALTER TABLE "OnboardingInvite" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OnboardingConfig" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requiredDocuments" JSONB,
    "requiredProfileFields" JSONB,
    "requiredLeaseTemplateIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingConfig_orgId_key" ON "OnboardingConfig"("orgId");

-- AddForeignKey
ALTER TABLE "OnboardingConfig" ADD CONSTRAINT "OnboardingConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
