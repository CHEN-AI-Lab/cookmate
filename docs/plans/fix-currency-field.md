# 规划：PaymentOrder 加 currency 字段

## 背景

当前方案：前端根据 `channel === "creem"` 硬编码显示 `$`，支付宝显示 `¥`。
问题：未来加新国际渠道（Stripe、PayPal）容易漏配币种符号。

目标：在数据库存 `currency` 字段（如 `"USD"` / `"CNY"`），前端直接用该字段取符号，
新增支付渠道无需改展示逻辑。

---

## 涉及文件

| # | 文件 | 改动内容 |
|---|------|---------|
| 1 | `prisma/schema.prisma` | `PaymentOrder` 模型加 `currency String?` 字段 |
| 2 | `prisma/migrations/` | 新建 migration，添加 `currency` 列 |
| 3 | `apps/web/src/app/api/creem/create-checkout/route.ts` | `data: { ..., currency: "USD" }` |
| 4 | `apps/web/src/app/api/alipay/create/route.ts` | `data: { ..., currency: "CNY" }` |
| 5 | `apps/web/src/app/[locale]/app/orders/page.tsx` | `fmtOrderAmount` 改用 `order.currency` |
| 6 | `apps/web/src/app/[locale]/admin/page.tsx` | `fmtAmount` 改用 `o.currency` |
| 7 | `apps/web/src/app/api/user/export/route.ts` | 改用 `o.currency` |
| 8 | `tests/unit/_helpers/mock-prisma.ts` | mock 兼容新字段（无需改，JS 对象自动透传） |
| 9 | `tests/unit/checkout-creem.test.ts` | 断言 `currency === "USD"` |
| 10 | `tests/unit/payment-alipay.test.ts` | 断言 `currency === "CNY"` |

---

## 详细步骤

### 1. 修改 schema.prisma

```prisma
model PaymentOrder {
  // ...现有字段
  amount             Int                             // 金额（分，按 currency 对应币种）
  currency           String?                         // 币种：USD / CNY / EUR ...
  // ...
}
```

**注意**：字段放 `amount` 后面，`@default("PENDING")` 前面。
`String?` 可空（兼容历史数据，但用户说会删旧数据）。

### 2. 创建 migration

```bash
pnpm prisma migrate dev --name add-currency-to-payment-order
```

输出新 migration SQL 文件到 `prisma/migrations/`。

### 3. Creem create-checkout 写入 currency

`route.ts` 第 73 行附近，`amount` 旁边加一行：
```typescript
amount: price.amount,    // 美分（USD）
currency: "USD",         // 币种
```

### 4. Alipay create 写入 currency

`alipay/create/route.ts` 第 46 行附近，加一行：
```typescript
amount: price.amount,
currency: "CNY",
```

### 5. 用户订单页 orders/page.tsx — 改用 currency

当前：
```typescript
function fmtOrderAmount(order: { channel: string; amount: number }): string {
  const symbol = order.channel === "creem" ? "$" : "¥"
  return `${symbol}${(order.amount / 100).toFixed(2)}`
}
```

改为：
```typescript
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", CNY: "¥" }

function fmtOrderAmount(order: { currency?: string; amount: number }): string {
  const symbol = order.currency ? (CURRENCY_SYMBOLS[order.currency] || "?") : "?"
  return `${symbol}${(order.amount / 100).toFixed(2)}`
}
```

同时更新 `Order` 接口增加 `currency?: string`。

### 6. 后台 admin/page.tsx — 改用 currency

当前：
```typescript
function fmtAmount(amount: number, channel?: string) {
  const symbol = channel === "creem" ? "$" : "¥"
  return `${symbol}${(amount / 100).toFixed(2)}`
}
```

改为：
```typescript
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", CNY: "¥" }

function fmtAmount(amount: number, currency?: string) {
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] || "?") : "?"
  return `${symbol}${(amount / 100).toFixed(2)}`
}
```

**注意**：后台调用处 `fmtAmount(o.amount, o.channel)` 改为 `fmtAmount(o.amount, o.currency)`。
同时更新 `AdminOrder` 接口加 `currency?: string`。

### 7. 数据导出 export/route.ts — 改用 currency

当前：
```typescript
amount: `${o.channel === "creem" ? "$" : "¥"}${(o.amount / 100).toFixed(2)}`,
```

改为：
```typescript
const sym = o.currency === "USD" ? "$" : "¥"
amount: `${sym}${(o.amount / 100).toFixed(2)}`,
```

### 8. 测试更新

#### checkout-creem.test.ts
新增断言：
```typescript
expect(order.currency).toBe("USD")
```

#### payment-alipay.test.ts
新增断言：
```typescript
expect(prismaMock.paymentOrder.create.mock.calls[0][0].data.currency).toBe("CNY")
```

---

## 验证步骤

1. `pnpm prisma validate` — schema 校验
2. `pnpm prisma migrate dev` — 应用 migration（不写 seed）
3. `pnpm run test` — 全部测试通过（321+2=323）
4. `npx tsc --noEmit -p apps/web` — 类型检查无报错
5. `pnpm run build` — 构建通过
6. `bash scripts/check.sh` — 全量检查通过

---

## 不做的事

- 不改 admin orders API 的返回结构（仍传 currency 字段即可，不需要改统计逻辑）
- 不处理历史脏数据（用户确认会删除）
- 不改动任何支付逻辑（只存 currency，不触发任何行为变化）
