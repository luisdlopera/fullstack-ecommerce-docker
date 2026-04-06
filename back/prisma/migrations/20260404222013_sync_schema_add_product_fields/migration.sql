-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "compareAtPrice" DOUBLE PRECISION,
ADD COLUMN     "discountEndsAt" TIMESTAMP(3),
ADD COLUMN     "discountPrice" DOUBLE PRECISION,
ADD COLUMN     "discountStartsAt" TIMESTAMP(3);
