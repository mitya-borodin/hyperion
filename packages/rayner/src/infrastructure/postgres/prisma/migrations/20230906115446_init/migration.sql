-- CreateTable
CREATE TABLE "_settings" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "HyperionDevice" (
    "deviceId" TEXT NOT NULL PRIMARY KEY,
    "driver" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "title" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT NOT NULL DEFAULT '{}',
    "meta" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "HyperionDeviceControl" (
    "deviceId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "readonly" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "units" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "max" REAL NOT NULL DEFAULT 0,
    "min" REAL NOT NULL DEFAULT 0,
    "precision" REAL NOT NULL DEFAULT 0,
    "value" TEXT NOT NULL DEFAULT '0',
    "topic" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "meta" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "HyperionDeviceControl_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HyperionDevice" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_settings_name_key" ON "_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HyperionDeviceControl_deviceId_controlId_key" ON "HyperionDeviceControl"("deviceId", "controlId");
