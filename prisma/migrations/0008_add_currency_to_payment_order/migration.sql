-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN "currency" TEXT;

-- CreateIndex
CREATE INDEX "PaymentOrder_currency_idx" ON "PaymentOrder"("currency");
