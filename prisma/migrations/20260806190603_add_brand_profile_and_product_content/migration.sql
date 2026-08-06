-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "brand_name" TEXT NOT NULL,
    "slogan" TEXT,
    "description" TEXT,
    "target_audience" TEXT,
    "brand_values" JSONB,
    "tonality" TEXT NOT NULL DEFAULT 'professional',
    "colors" JSONB,
    "industry" TEXT,
    "primary_language" TEXT NOT NULL DEFAULT 'de',
    "secondary_language" TEXT,
    "ai_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "product_name" TEXT,
    "content_type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "keyword" TEXT,
    "prompt" TEXT,
    "generated_content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_contents_content_type_status_idx" ON "product_contents"("content_type", "status");
