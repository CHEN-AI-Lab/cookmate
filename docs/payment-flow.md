# CookMate 支付流程（Creem）— 固定文档 v1.0

> 本文档固定支付全流程。任何修改必须先更新此文档，再改代码，再写测试。

## 一、数据模型

### User（用户）
| 字段 | 说明 |
|---|---|
| subscriptionTier | "FREE" / "PRO" |
| subscriptionExpiryDate | 到期日（null = 未开通） |
| creemSubscriptionId | Creem 订阅 ID（sub_xxx），用于事件反查用户 |

### PaymentOrder（订单）
| 字段 | 说明 |
|---|---|
| orderId | 业务订单号（本地 CKCRxxx），@unique |
| externalCheckoutId | Creem 侧 checkout ID（ch_xxx），**webhook + GET 反查的关键** |
| channel | creem / alipay |
| period | monthly / annual（webhook 写入） |
| amount | 金额（分） |
| status | PENDING → PAID（**没有 CANCELED/EXPIRED 流转入口**） |

### WebhookLog（回调流水）
| 字段 | 说明 |
|---|---|
| eventId | Creem 事件 ID（evt_xxx），@unique |
| status | received → processed / duplicate / failed:xxx / ignored |
| rawBody | 原始请求体（received 时写入，processed 不再覆盖） |

## 二、完整支付流程（Creem）

### 阶段 1：创建订单（我们的服务器）

```
用户点「订阅」按钮
  → billing/page.tsx handleCreemUpgrade(period)
  → POST /api/creem/create-checkout { period }
  → createCheckout() 调 Creem API /v1/checkouts
      body: { product_id, success_url: "https://.../app/billing?success=true", metadata: { userId, period } }
  → Creem 返回 { checkout_url: "https://checkout.creem.io/ch_xxx", id: "ch_xxx" }
  → 本地写 PaymentOrder:
      orderId=generateOrderId("creem")  // CKCRxxx
      externalCheckoutId="ch_xxx"
      channel="creem", period=传入的 period
      amount=PRICING.get(period, "CNY").amount
      status="PENDING"
  → 返回 { url: checkout_url } 给前端
  → 前端 window.location.href = checkout_url 跳转 Creem
```

**关键状态**：PaymentOrder: PENDING，externalCheckoutId=ch_xxx

### 阶段 2：用户在 Creem 收银台支付

```
用户在 checkout.creem.io/ch_xxx 页面支付
  → 支付成功 → Creem 触发 webhook 事件（见阶段 3）
  → 浏览器重定向到 success_url: /app/billing?success=true
```

### 阶段 3：Creem Webhook 回调（我们的服务器）

Creem 按顺序发送事件（官方文档）：

```
1. checkout.completed
   → 处理逻辑（route.ts:355）：
     - resolveUserId：metadata.userId 或 subscriptionId 反查
     - recordOrder(userId, checkoutId, period)：
         查 PaymentOrder 匹配 (userId, channel=creem, status=PENDING, externalCheckoutId)
         → 匹配上则 updateMany 置 PAID（带 status=PENDING 条件，幂等）
     - syncSubscription(userId, subscriptionId)：同步 creemSubscriptionId，**不升级用户**
   → logWebhook(processed)

2. subscription.active
   → syncSubscription(userId, subscriptionId)：只同步订阅ID，**不升级用户**
   → logWebhook(processed)

3. subscription.paid  ← 唯一升级入口（官方推荐）
   → resolveUserId：metadata.userId 或 subscriptionId 反查
   → grantAccess(userId, subscriptionId, periodEndDate)：
       - 用户不存在 → failed:user-not-found，返回 500 让 Creem 重试
       - 已 PRO 且到期日 >= 本次周期 → already-pro，幂等跳过
       - 否则 → User 置 subscriptionTier=PRO, subscriptionExpiryDate=periodEndDate
   → logWebhook(processed)
```

**关键状态**：PaymentOrder: PAID；User: PRO（仅当 subscription.paid 到达）

### 阶段 4：用户回到 ?success=true（GET 轮询兜底）

```
billing/page.tsx useEffect:
  ?success=true 时
  → GET /api/creem/create-checkout（无 checkoutId）
      → 查最近一条 Creem 订单（不限状态，F1 修复：PAID 也能查到）
      → 有 → 返回 { checkoutId } 
      → 无 → 返回 { message: "没有待处理的 Creem 订单" }（无 checkoutId！）
  → 有 checkoutId → GET /api/creem/create-checkout?checkoutId=ch_xxx
      → retrieveCheckout(ch_xxx) 查 Creem
      → status === "completed"
        → 标记本地订单 PAID（如果还 PENDING）
        → 升级兜底：用户非 PRO 或到期日更早 → 置 PRO
  → 无论结果 setRefreshKey+1 刷新 dashboard
```

## 三、断点与修复（v1.0 已实施）

### 断点 B1（根因）：subscription.paid 未到达

用户用的是 **Creem 测试账号**（API key 前缀 `creem_test_`，走 `test-api.creem.io`）。

- 测试模式发的事件可能只有 `checkout.completed`，**不保证发 `subscription.paid`**
- checkout.completed 只把订单置 PAID + 同步订阅ID，**不升级用户**
- 结果：用户看到"支付成功"（订单 PAID），但 User 还是 FREE

**修复 F2（已实施）**：`checkout.completed` 处理时，若订单已支付（`order.status === "paid"` 或 `checkout.status === "completed"`）且用户非 PRO（或到期日早于本次应得周期）→ 按周期推算到期日直接升级。已 PRO 且到期日更晚 → 幂等跳过。

### 断点 B2：GET 兜底轮询查不到订单

```
?success=true 回来时，webhook checkout.completed 已经把订单 PENDING→PAID
→ GET /api/creem/create-checkout（无参）查「最近 PENDING 订单」
→ 查不到（已是 PAID）→ 返回无 checkoutId
→ 前端拿不到 checkoutId → 不轮询 → 不升级
```

**修复 F1（已实施）**：GET 无参分支改为查「最近一条 Creem 订单（不限状态）」，PAID 订单也能返回 checkoutId，轮询兜底始终可执行。

### 修复 F3（已实施）**：幂等统一
- webhook（F2 升级 + subscription.paid grantAccess）与 GET 兜底都用「到期日比较」做幂等
- 同一支付事件重复到达（Creem 重试/并发）不会重复加时长

## 五、测试用例（实施后覆盖）

| # | 场景 | 预期 |
|---|---|---|
| T1 | POST 创建 checkout，写订单 PENDING | PaymentOrder 创建成功，externalCheckoutId=ch_xxx |
| T2 | webhook checkout.completed 到达，订单 PENDING | 订单→PAID，用户升级 PRO（F2 兜底） |
| T3 | webhook checkout.completed 到达，订单已 PAID | 幂等：订单不变，用户不重复加时长 |
| T4 | webhook subscription.paid 到达 | 用户 PRO，到期日=periodEndDate |
| T5 | 支付成功回 ?success=true，订单已 PAID（B2 场景） | GET 无参能返回 checkoutId（F1），轮询后升级 |
| T6 | GET 轮询：checkout status=completed，用户 FREE | 升级 PRO，到期日=now+period |
| T7 | GET 轮询：用户已 PRO 且到期日更晚 | 幂等跳过，不缩短/不延长 |
| T8 | 用户已 PRO，checkout.completed 再来 | 不重复加时长 |
