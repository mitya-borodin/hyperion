-- CreateTable
CREATE TABLE "_settings" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" TEXT NOT NULL,
    "driver" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "title" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT NOT NULL DEFAULT '{}',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceId")
);

-- CreateTable
CREATE TABLE "Control" (
    "deviceId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "readonly" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "units" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precision" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "value" TEXT NOT NULL DEFAULT '0',
    "topic" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '0',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "_settings_name_key" ON "_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Control_deviceId_controlId_key" ON "Control"("deviceId", "controlId");

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_deviceId_controlId_fkey" FOREIGN KEY ("deviceId", "controlId") REFERENCES "Control"("deviceId", "controlId") ON DELETE CASCADE ON UPDATE CASCADE;
