/*
  Warnings:

  - The `labels` column on the `Macros` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Macros" DROP COLUMN "labels",
ADD COLUMN     "labels" TEXT[];
