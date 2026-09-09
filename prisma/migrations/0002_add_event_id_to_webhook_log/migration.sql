-- 0002_add_event_id_to_webhook_log
-- 给 WebhookLog 表加 eventId 字段，用于 Creem webhook 事件ID幂等去重

-- AlterTable
ALTER TABLE "WebhookLog" ADD COLUMN "eventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WebhookLog_eventId_key" ON "WebhookLog"("eventId");
