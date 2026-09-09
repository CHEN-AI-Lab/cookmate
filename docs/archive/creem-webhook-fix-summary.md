# Creem Webhook 处理器重写总结

**日期**：2026-08-24
**Commit**：`bf7bf60`（已推 preview 分支，Vercel 自动部署中）

## 修复了什么

### 核心问题（P0）
一次订阅购买触发 3 个事件（`checkout.completed` → `subscription.active` → `subscription.paid`），旧代码三个都调 `upgradeUser`，导致用户买 1 个月得 3 个月。加上 Creem 重试 5 次，最差能得 6~8 个月。

### 修复方案（基于 Creem 官方文档 docs.creem.io）

| 改动 | 说明 | 官方依据 |
|------|------|---------|
| 事件ID去重 | WebhookLog 加 `eventId` 字段（唯一索引），处理前查是否已处理过 | "the same event can arrive more than once, keep your handler idempotent" |
| 单一授予点 | 只有 `subscription.paid` 升级用户 | "use subscription.paid to activate user access" |
| subscription.active 只同步 | 只存 creemSubscriptionId，不升级 | "subscription.active is only for data synchronization" |
| 用官方到期日 | 直接用 `current_period_end_date`，不再自己算 | payload 含此字段 |
| userId 反查兜底 | metadata.userId → creemSubscriptionId 反查数据库 | 防止 metadata 没带 userId |
| 补齐 11 个事件 | paused/past_due/expired/canceled/update/trialing/scheduled_cancel 全部处理 | 官方事件列表 |

## 改了哪些文件

1. **`prisma/schema.prisma`** — WebhookLog 加 `eventId String? @unique`
2. **`prisma/migrations/0002_add_event_id_to_webhook_log/migration.sql`** — 迁移 SQL（手写，因 DIRECT_URL 没配）
3. **`apps/web/src/app/api/webhook/creem/route.ts`** — 完全重写（356 行新增，133 行删除）

## 验证结果

`scripts/check.sh` 6/6 全绿：
- ✅ 结构检查
- ✅ 迁移安全
- ✅ ESLint
- ✅ 翻译对齐
- ✅ TypeScript 编译
- ✅ 单元测试

Pre-commit 钩子也全过（结构检查 + 测试 + 迁移安全检查）。

## 待办（上线前必须做）

1. **执行数据库迁移**：`npx prisma migrate deploy`（需要配好 `DIRECT_URL` 环境变量）
2. **Creem 测试模式验证**：用测试卡 `4242 4242 4242 4242` 走一遍完整流程，确认：
   - 购买后只升 1 次级（不是 3 次）
   - 退款后降级 FREE
   - 取消订阅后清订阅ID但保留 PRO 到期
3. **Preview 环境测试**：Vercel 部署完成后，在 preview 环境验证支付流程
