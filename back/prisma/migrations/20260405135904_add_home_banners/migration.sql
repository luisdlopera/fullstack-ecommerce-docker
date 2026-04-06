-- CreateTable
CREATE TABLE "home_banners" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "cta_text" TEXT,
    "cta_link" TEXT,
    "secondary_text" TEXT,
    "secondary_link" TEXT,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT,
    "storage_provider" TEXT,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_banners_storage_key_key" ON "home_banners"("storage_key");

-- CreateIndex
CREATE INDEX "home_banners_is_active_sort_order_idx" ON "home_banners"("is_active", "sort_order");
