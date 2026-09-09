# 支付测试缺口分析

## 现状

现有支付相关测试文件：
- `checkout-creem.test.ts` — 11 个（POST 创建 + GET 轮询）
- `payment-alipay.test.ts` — 17 个（创建 + 异步通知）
- `payment-creem-webhook.test.ts` — ~28 个（webhook 事件处理）
- `payment-cancel.test.ts` — 9 个（取消订阅）
- `dashboard.test.ts` — 10 个（dashboard API，含订单列表）
- `orders-delete.test.ts` — 6 个（删除订单）
- `admin-orders-webhook-logs.test.ts` — 8 个（后台 API）
- `admin-cancel-logs.test.ts` — 8 个（取消日志）
- `subscription.test.ts` — ~20 个（日期工具 + UI 条件）
- `pricing.test.ts` — 7 个（定价常量）

E2E：仅 `public-pages.spec.ts`，无支付流程 E2E。

---

## 缺口清单（按优先级）

### P0 — 缺钱安全 / 正确性（必须补）

| # | 位置 | 缺失场景 | 风险 |
|---|------|---------|------|
| 1 | `dashboard.test.ts` | orders 响应中的 `currency` 字段 | 用户看不到币种，显示 `?` |
| 2 | `payment-alipay.test.ts` | 多付（total_amount > 订单金额）→ 是否拒绝 | 用户多付仍能升级 |
| 3 | `payment-alipay.test.ts` | 空 total_amount / 缺失字段 | 崩溃或静默升级 |
| 4 | `payment-creem-webhook.test.ts` | refund.created 但 userId 不存在 | 应 fail-closed |
| 5 | 新建 `payment-integration.test.ts` | Alipay 完整流程：create → notify → PRO | 无集成测试 |
| 6 | 新建 `payment-integration.test.ts` | Creem 完整流程：create → webhook subscription.paid → PRO | 无集成测试 |

### P1 — 健壮性（应该补）

| # | 位置 | 缺失场景 |
|---|------|---------|
| 7 | `dashboard.test.ts` | 历史订单 currency=null 时不崩溃 |
| 8 | `admin-orders-webhook-logs.test.ts` | 响应包含 currency 字段断言 |
| 9 | 新建 `export.test.ts` | 导出金额按币种显示（USD→$，CNY→¥） |
| 10 | `checkout-creem.test.ts` | GET 轮询时订单 currency 字段 |
| 11 | `checkout-creem.test.ts` | 非法 period 参数 → 默认 monthly |

### P2 — 边界 / 安全

| # | 位置 | 缺失场景 |
|---|------|---------|
| 12 | `payment-alipay.test.ts` | total_amount 为 0 |
| 13 | `payment-creem-webhook.test.ts` | checkout.completed 时 orderPaid=false 但用户是 FREE → 不升级 |
| 14 | `orders-delete.test.ts` | PAID 订单跨用户删除尝试 |
| 15 | `subscription.test.ts` | 到期日边界（刚好今天到期） |

---

## 按测试维度矩阵

| 维度 | 已有 | 缺失 |
|------|------|------|
| 功能测试 | 渠道创建、webhook 事件、取消、日期工具 | 多付、空参数、currency 字段、完整流程集成 |
| 集成测试 | 无（全单元） | Alipay 端到端、Creem 端到端 |
| 安全性测试 | 跨用户 404、签名验证、DoS | 多付攻击、currency 注入、amount 篡改 |
| 性能测试 | 无 | webhook 批量、大数据量订单列表 |
| 兼容性测试 | 无 | 时区边界 |
| 易用性测试 | 无 | loading/empty/error 状态 |
| E2E 测试 | 仅公开页面加载 | 支付全流程 |

---

## 执行计划

### Step 1: 补 dashboard.test.ts（+2 个用例）
- 断言 orders 返回 currency 字段
- 断言 currency=null 的历史订单不崩溃

### Step 2: 补 alipay notify 边界（+4 个用例）
- total_amount 为空 → failure
- total_amount = 0 → failure
- total_amount > 订单金额（多付）→ failure
- 缺失 out_trade_no → failure

### Step 3: 新建 payment-integration.test.ts（+6 个用例）
- Alipay 完整流程：创建 → notify → 升级 + currency=CNY
- Alipay 年付完整流程
- Creem 完整流程：创建 → webhook subscription.paid → 升级 + currency=USD
- Creem 年付完整流程
- Creem webhook checkout.completed 兜底升级
- 跨渠道订单隔离（Alipay 用户不能通过 Creem webhook 升级）

### Step 4: 新建 export.test.ts（+3 个用例）
- 导出包含 USD 订单 → 显示 $
- 导出包含 CNY 订单 → 显示 ¥
- 导出包含 currency=null 订单 → 显示 ¥（兜底）

### Step 5: 补 creem checkout-creem.test.ts（+2 个用例）
- 非法 period → 默认 monthly
- GET 轮询返回的订单含 currency

### Step 6: 补 admin-orders 测试（+1 个用例）
- 响应含 currency 字段

预计新增 ~18 个测试用例，总数从 321 → ~339。
