-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "object_key" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_photos_object_key_key" ON "gallery_photos"("object_key");

-- CreateIndex
CREATE INDEX "gallery_photos_created_at_idx" ON "gallery_photos"("created_at" DESC);
