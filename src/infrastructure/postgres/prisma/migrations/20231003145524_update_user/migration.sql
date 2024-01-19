/*
  Warnings:

  - You are about to drop the column `is2FaActivated` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorSecret` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "is2FaActivated",
DROP COLUMN "twoFactorSecret",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isTwoFaActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFaSecret" TEXT;
