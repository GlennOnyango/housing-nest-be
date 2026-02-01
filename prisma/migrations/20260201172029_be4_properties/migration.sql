-- CreateTable
CREATE TABLE "UnitRentChange" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "houseUnitId" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "rent" DECIMAL(12,2) NOT NULL,
    "deposit" DECIMAL(12,2) NOT NULL,
    "serviceCharge" DECIMAL(12,2) NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitRentChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitRentChange_orgId_idx" ON "UnitRentChange"("orgId");

-- CreateIndex
CREATE INDEX "UnitRentChange_houseUnitId_idx" ON "UnitRentChange"("houseUnitId");

-- AddForeignKey
ALTER TABLE "UnitRentChange" ADD CONSTRAINT "UnitRentChange_houseUnitId_fkey" FOREIGN KEY ("houseUnitId") REFERENCES "HouseUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
