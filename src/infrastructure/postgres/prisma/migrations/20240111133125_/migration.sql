/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `History` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Control" ALTER COLUMN "value" SET DEFAULT 'UNSPECIFIED',
ALTER COLUMN "off" SET DEFAULT 'UNSPECIFIED',
ALTER COLUMN "on" SET DEFAULT 'UNSPECIFIED';

-- AlterTable
ALTER TABLE "History" DROP COLUMN "updatedAt";
