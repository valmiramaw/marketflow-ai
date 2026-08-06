-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "aws_access_key_id" TEXT,
ADD COLUMN     "aws_region" TEXT,
ADD COLUMN     "aws_secret_access_key" TEXT;
