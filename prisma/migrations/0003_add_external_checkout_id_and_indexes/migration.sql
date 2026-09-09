-- 0003_add_external_checkout_id_and_indexes
-- 给 PaymentOrder 加 externalCheckoutId 字段（支付平台侧的 checkout/session ID），并加索引
-- 给 PaymentOrder 和 WebhookLog 加查询性能索引

-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN "externalCheckoutId" TEXT;

-- CreateIndex
CREATE INDEX "PaymentOrder_externalCheckoutId_idx" ON "PaymentOrder"("externalCheckoutId");

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_status_idx" ON "PaymentOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "WebhookLog_source_createdAt_idx" ON "WebhookLog"("source", "createdAt");