-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_billingId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_keyId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_planUsageId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_statsId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "keyId" DROP NOT NULL,
ALTER COLUMN "planUsageId" DROP NOT NULL,
ALTER COLUMN "statsId" DROP NOT NULL,
ALTER COLUMN "billingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planUsageId_fkey" FOREIGN KEY ("planUsageId") REFERENCES "PlanUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_statsId_fkey" FOREIGN KEY ("statsId") REFERENCES "Stats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
