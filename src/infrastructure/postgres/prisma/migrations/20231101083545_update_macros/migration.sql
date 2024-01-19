/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Macros` table. All the data in the column will be lost.
  - You are about to drop the column `input` on the `Macros` table. All the data in the column will be lost.
  - You are about to drop the column `output` on the `Macros` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Macros` table. All the data in the column will be lost.
  - Added the required column `settings` to the `Macros` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Macros" DROP COLUMN "createdAt",
DROP COLUMN "input",
DROP COLUMN "output",
DROP COLUMN "updatedAt",
ADD COLUMN     "settings" JSONB NOT NULL;
