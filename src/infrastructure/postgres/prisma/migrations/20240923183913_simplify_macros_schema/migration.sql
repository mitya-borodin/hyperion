-- AlterTable
ALTER TABLE "Macros" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "settings" DROP NOT NULL,
ALTER COLUMN "settings" DROP DEFAULT,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "state" DROP DEFAULT;
