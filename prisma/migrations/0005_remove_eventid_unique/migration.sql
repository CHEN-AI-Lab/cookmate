-- DropIndex
DROP INDEX IF EXISTS "WebhookLog_eventId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebhookLog_eventId_idx" ON "WebhookLog"("eventId");
