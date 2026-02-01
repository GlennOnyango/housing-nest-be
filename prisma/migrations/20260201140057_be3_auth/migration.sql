-- DropForeignKey
ALTER TABLE "OnboardingInvite" DROP CONSTRAINT "OnboardingInvite_houseUnitId_fkey";

-- AlterTable
ALTER TABLE "OnboardingInvite" ADD COLUMN     "purpose" TEXT,
ALTER COLUMN "houseUnitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrgMembership" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_houseUnitId_fkey" FOREIGN KEY ("houseUnitId") REFERENCES "HouseUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
