-- DropIndex
DROP INDEX "UserAddress_userId_key";

-- CreateIndex
CREATE INDEX "UserAddress_userId_idx" ON "UserAddress"("userId");
