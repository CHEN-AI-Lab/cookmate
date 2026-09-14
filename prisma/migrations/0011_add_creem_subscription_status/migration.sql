-- Creem 官方订阅状态落库：webhook 收到 subscription.* 事件时原样写入 User.creemSubscriptionStatus。
-- 目的：后台「用户列表 → 订阅状态」可以直接用 Creem 的官方状态（active / past_due / paused / ...），
--       不再只能靠本地字段（tier + 到期日 + 最近一笔支付渠道）反推。
-- 纯新增可空列，不涉及任何数据迁移与回填；历史数据保持 NULL，判定逻辑会自动回退到反推。
ALTER TABLE "User" ADD COLUMN "creemSubscriptionStatus" TEXT;
