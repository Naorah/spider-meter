-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "device_id" TEXT NOT NULL,
    "humidity" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "sensor_readings_created_at_idx" ON "sensor_readings"("created_at" DESC);
