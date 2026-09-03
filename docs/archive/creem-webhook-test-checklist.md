# Creem Webhook 测试卡验证清单

> 测试卡号：`4242 4242 4242 4242`（任意未来日期、任意 CVC）
> 测试环境：Vercel Preview（部署完成后）
> 目的：确认支付环节零差池 —— 升级/降级/取消/退款/去重/乱序 全部符合预期

## 前置条件（必须全部满足才开始）

- [ ] Preview 已部署完成，环境变量齐全（`CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET` / `DATABASE_URL` 等）
- [ ] 数据库 `WebhookLog` 表已含 `eventId` 字段（部署自动建表，已确认存在）
- [ ] Creem 后台处于 **Test Mode（测试模式）**
- [ ] 准备一个**全新的测试用户**（或每次测试前清空该用户订阅状态）

## 核心 6 项检查

| # | 场景 | 操作步骤 | 预期结果（必须全部符合） | 怎么查 |
|---|------|---------|------------------------|--------|
| 1 | **新用户月付购买** | 注册新用户 → 点月付套餐 → 用 4242 卡完成支付 | ① 用户升级为 PRO；② 到期日 = 今天 + 1 个月；③ **只升 1 次级**，不重复 | 数据库 `user.subscriptionTier=PRO`、`subscriptionExpiryDate` 正确 |
| 2 | **去重（重复投递）** | 在 Creem 后台手动"重发"同一个 `subscription.paid` 事件 2~3 次 | ① 用户到期日**不变**（不变成 +2/+3 月）；② `WebhookLog` 只有 1 条 `processed`，其余为 `duplicate` | `SELECT * FROM WebhookLog WHERE eventId='evt_xxx'` |
| 3 | **退款降级** | 在 Creem 后台对该订单发起 `refund` | ① 用户降回 FREE；② `creemSubscriptionId` 被清空 | 数据库 `subscriptionTier=FREE`、`subscriptionExpiryDate=null`、订阅 ID 为空 |
| 4 | **取消保留期** | 用户点"取消订阅" | ① 用户**仍保留 PRO 直到原到期日**（不立即降级）；② `creemSubscriptionId` 被清空；③ 到期后变回 FREE（见下方注意） | 取消后查库：`Tier=PRO` 且订阅 ID 为空；到期后查：`Tier=FREE` |
| 5 | **事件乱序（自愈）** | 模拟 `subscription.paid` 早于 `checkout.completed` 到达 | **最终用户成功升级为 PRO**（无论中间是否先 500 重试）。重点看"结果对"，而非"一定先 500" | 查看 `WebhookLog`：若曾出现 `failed:unresolved` 后又有 `processed`，说明自愈生效 |
| 6 | **年付周期** | 用年付套餐 + 4242 卡支付 | ① 升级为 PRO；② 到期日 = 今天 + 1 年（不是 +1 月） | 数据库 `subscriptionExpiryDate` ≈ 今天 + 1 年 |

### 第 4 项「到期后变 FREE」的重要注意

取消后 `creemSubscriptionId` 已被清空，到期后能否变 FREE **依赖 Creem 发送 `subscription.expired` 事件且该事件携带 `metadata.userId`**（与所有 `subscription.*` 事件结构一致）。验证第 4 项时请重点确认：

- `subscription.expired` 事件确实到达（后台可看投递记录）；
- 该事件能解析到用户（即库里最终变 FREE）。

> 双保险建议：若应用前端/接口在判断"是否 PRO"时**同时校验 `subscriptionExpiryDate > now`**（而非只看 `Tier` 字段），则即使 `expired` 事件偶发丢失，用户到期也会自然失去 PRO 权限，安全冗余更强。验证时一并确认这点。

### 第 5 项说明（避免误解）

正常情况下 `subscription.paid` 事件本身就携带 `metadata.userId`，**即使早于 `checkout.completed` 到达也能直接解析到用户并升级**，不一定会先 500。返回 500 重试只是 `metadata` 缺失时的兜底安全网。所以第 5 项的断言应聚焦在**"最终升级成功"**，而不是"第一次一定 500"。

## 补充检查（可选，覆盖边界事件）

| # | 场景 | 预期结果 |
|---|------|---------|
| 7 | **暂停 `subscription.paused`** | 立即降 FREE，但**保留** `creemSubscriptionId`（恢复时重新授权） |
| 8 | **扣款失败 `subscription.past_due`** | 立即降 FREE，但**保留** `creemSubscriptionId`（重试成功会重新授权） |
| 9 | **升级型变更 `subscription.update`（月→年）** | 到期日同步更新为新的周期结束日，仍为 PRO |

## 验证通过后的上线动作

1. 上面 6 项（含第 4 项注意点）全部符合预期 → 告知我"上线"
2. 我创建 PR（preview → main），**不自主合并**
3. 你 review 后合并 → Vercel 自动部署 Production

---

## 复查结论（2026-08-24）

逐项核对 `apps/web/src/app/api/webhook/creem/route.ts` 实际代码后：

- **第 1、2、3、6 项：正确**，与代码逻辑一致。
- **第 4 项：基本正确，但有依赖** —— "到期后变 FREE" 依赖 `subscription.expired` 事件能解析到用户（cancel 已清空订阅 ID，兜底反查失效，只剩 `metadata.userId` 一条路）。Creem 的 `subscription.*` 事件结构一致，正常能解析；但建议测试时重点确认，并最好有"运行时校验到期日"的双保险。
- **第 5 项：结论对，措辞需收紧** —— 自愈（最终升级）一定对；但"第一次 500"未必发生，因 `paid` 事件自带 `metadata.userId`。断言应改为"看最终结果"。
- 已补充第 7/8/9 项覆盖 `paused` / `past_due` / `update` 三个边界事件。
