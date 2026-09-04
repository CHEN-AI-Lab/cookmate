-- 0006_restore_eventid_unique
-- 恢复 WebhookLog.eventId 唯一约束（0005 误删）。
-- 恢复前必须先清理 0005 期间产生的同 eventId 重复记录（received + processed 两行），
-- 否则 CREATE UNIQUE INDEX 会因重复值失败。
-- 策略：同一 eventId 保留最早一行（id 最小 = received 带原文），删除其余重复行。

-- Cleanup duplicates: keep the earliest row per eventId, delete the rest
DELETE FROM "WebhookLog" a
USING "WebhookLog" b
WHERE a."eventId" = b."eventId"
  AND a."eventId" IS NOT NULL
  AND a.id > b.id;

-- DropIndex (the non-unique index created by 0005)
DROP INDEX IF EXISTS "WebhookLog_eventId_idx";

-- CreateIndex (restore unique constraint, matching Prisma's expected name)
CREATE UNIQUE INDEX "WebhookLog_eventId_key" ON "WebhookLog"("eventId");
