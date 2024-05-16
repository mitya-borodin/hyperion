-- CreateTable
CREATE TABLE "_settings" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "salt" TEXT,
    "hash" TEXT,
    "isTwoFaActivated" BOOLEAN NOT NULL DEFAULT false,
    "twoFaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "expiresIn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "driver" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "error" TEXT NOT NULL DEFAULT '{}',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "markup" TEXT NOT NULL DEFAULT '{}',
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
    "type" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "readonly" BOOLEAN NOT NULL DEFAULT true,
    "units" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "step" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precision" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "on" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "off" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "toggle" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "enum" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "value" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "presets" TEXT NOT NULL DEFAULT '{}',
    "topic" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "markup" TEXT NOT NULL DEFAULT '{}',
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

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Macros" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "labels" TEXT[],
    "settings" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Macros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "_settings_name_key" ON "_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_refreshToken_key" ON "RefreshSession"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Control_deviceId_controlId_key" ON "Control"("deviceId", "controlId");

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_deviceId_controlId_fkey" FOREIGN KEY ("deviceId", "controlId") REFERENCES "Control"("deviceId", "controlId") ON DELETE CASCADE ON UPDATE CASCADE;
