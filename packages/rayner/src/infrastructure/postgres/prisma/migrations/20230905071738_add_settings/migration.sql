-- CreateTable
CREATE TABLE "_settings" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_settings_name_key" ON "_settings"("name");
