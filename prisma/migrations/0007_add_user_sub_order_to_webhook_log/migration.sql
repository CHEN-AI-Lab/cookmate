-- Add userId, subscriptionId, orderId columns to WebhookLog
ALTER TABLE "WebhookLog" ADD COLUMN "userId" TEXT;
ALTER TABLE "WebhookLog" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "WebhookLog" ADD COLUMN "orderId" TEXT;

-- Add index on userId for admin filtering
CREATE INDEX "WebhookLog_userId_idx" ON "WebhookLog"("userId");
