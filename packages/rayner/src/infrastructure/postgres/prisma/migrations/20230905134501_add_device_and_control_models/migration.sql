-- CreateTable
CREATE TABLE "HyperionDeviceControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "readonly" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "units" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "max" REAL NOT NULL DEFAULT 0,
    "min" REAL NOT NULL DEFAULT 0,
    "precision" REAL NOT NULL DEFAULT 0,
    "value" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "topic" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "meta" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "HyperionDeviceControl_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HyperionDevice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HyperionDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driver" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "title" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "meta" TEXT NOT NULL DEFAULT 'UNSPECIFIED'
);
INSERT INTO "new_HyperionDevice" ("id") SELECT "id" FROM "HyperionDevice";
DROP TABLE "HyperionDevice";
ALTER TABLE "new_HyperionDevice" RENAME TO "HyperionDevice";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "HyperionDeviceControl_deviceId_key" ON "HyperionDeviceControl"("deviceId");
