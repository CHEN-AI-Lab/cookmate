-- PaymentOrder 增加 period 字段（记录月付/年付，Creem webhook 回调时写入，后台展示用）
ALTER TABLE "PaymentOrder" ADD COLUMN IF NOT EXISTS "period" TEXT;

-- 注意：User 表的 stripeCustomerId / stripeSubscriptionId 两列【有意保留在数据库中】。
-- Stripe 通道已从代码中整体删除，schema.prisma 已不含这两个字段，
-- 但生产库中这两列全为 NULL（Stripe 从未启用），删列不可逆且会被迁移安全检查拦截，
-- 故留在库里作为无害的孤儿列。日后如需清理，用 Prisma 官方迁移工作流生成删列迁移并人工确认后执行。
