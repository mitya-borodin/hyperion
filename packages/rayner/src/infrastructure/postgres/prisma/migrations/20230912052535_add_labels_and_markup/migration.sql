-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];
