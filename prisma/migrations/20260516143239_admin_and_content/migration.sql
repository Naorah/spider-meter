-- DropIndex
DROP INDEX "sensor_readings_created_at_idx";

-- CreateTable
CREATE TABLE "admin_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "spider_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "species_notes" TEXT NOT NULL,
    "moved_in_date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "molts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "molt_date" DATETIME NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "news_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "news_items_published_at_idx" ON "news_items"("published_at" DESC);

-- CreateIndex
CREATE INDEX "sensor_readings_created_at_idx" ON "sensor_readings"("created_at");
