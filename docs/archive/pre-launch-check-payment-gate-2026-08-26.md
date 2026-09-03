# CookMate 上线前闸门检查（支付/订阅模块）

**日期**：2026-08-26
**场景**：上线前检查（Pre-Launch Gate / Go-NoGo）
**参与成员**：安全卫士（OWASP+STRIDE 收口确认）、质量门神（部署就绪 + 测试覆盖）

---

## 📌 TL;DR（执行摘要）
- 整体结论：🔴 **No-Go（当前不能上线）**
- 阻塞项数量：1 个 P0 + 1 个 P1 + 1 个 P2
- 根因：上轮把 dashboard GET 改为只读（修复 REST 语义违规）后，过期降级逻辑依赖 `expire-sweep.mjs` 定时跑；但 Vercel Cron 的触发入口（HTTP 路由 + vercel.json crons 配置）从未落地，导致降级链路完全断裂。
- 下一步：补 `/api/cron/expire-sweep` 路由 + `apps/web/vercel.json` 的 `crons` 字段，重新 push 部署；reconcile 脚本同理补上或保持手动。

---

## 🎯 核心结论卡片

| 项目 | 内容 |
|------|------|
| Go / No-Go | 🔴 No-Go（B1 未修前不可上线） |
| 严重度分布 | 🔴 P0×1 / 🟠 P1×1 / 🟡 P2×1 |
| 关键行动项 | 3 条（建 cron 路由 + vercel.json crons + 环境变量核对） |
| 建议负责人 | 主理人 + 用户（方案决策） |

---

## 1. 各成员核心结论

### 🛡️ 安全卫士（上线前安全收口）
- 核心判断：上轮 5 轮加固（SDK 错误封装、Webhook 迟到降级防护、admin 审计、demo 拦截、取消事务化）均已 commit+push，安全面无新增 P0/P1 残留。
- 关键风险点：`.env.example` 已声明 `CRON_SECRET` 用于护 `/api/cron/*`，但对应路由与校验逻辑不存在 → 属于"文档承诺未兑现"，不是越权漏洞，但会让运维误以为有 cron 保护。
- 建议：补 cron 路由时一并实现 `CRON_SECRET` Bearer 校验（否则任何人可触发降级/对账，属未授权执行）。

### ✅ 质量门神（部署就绪 + 测试）
- 核心判断：🔴 **过期订阅降级链路断裂**，是上线硬阻塞。
- 证据（源码核查）：
  - `apps/web/vercel.json` 只有 `framework/installCommand/buildCommand`，**无 `crons` 字段**；
  - 全仓 grep `api/cron` **无任何引用**，即不存在 `/api/cron/expire-sweep` 路由；
  - `scripts/expire-sweep.mjs` 注释明确要求 Vercel Cron 调用 `/api/cron/expire-sweep`，但该路由不存在；
  - Vercel Cron 机制：只能定时向**应用的 HTTP 路由**发请求，**无法直接执行 node 脚本**。
- 影响：dashboard GET 已改为只读（不再写库降级），若 cron 不复活，PRO 到期用户**永远不会降级** → 业务/收入逻辑错误。
- 测试覆盖：最近一次 `300/300` 通过（commit 2775808），但测试未覆盖"cron 实际触发降级"的集成路径（单测只验了 dashboard 读状态）。

---

## 2. 综合审查发现（按严重度）

| # | 严重度 | 类别 | 位置 | 问题描述 | 建议 | 来源 |
|---|--------|------|------|---------|------|------|
| 1 | 🔴 P0 | 部署/逻辑 | apps/web/vercel.json + 缺 /api/cron/expire-sweep | 过期降级链路断裂：vercel.json 无 crons、无 cron 路由，PRO 过期用户不降级 | 建 /api/cron/expire-sweep 路由（CRON_SECRET 校验）+ vercel.json 加 crons（建议每日 03:00 UTC） | 质量门神 |
| 2 | 🟠 P1 | 部署/运维 | 缺 /api/cron/reconcile-cancellations + vercel.json | 取消对账脚本无法自动运行，fail-closed 产生的失败取消记录不被自动发现 | 随 P0 一起补 /api/cron/reconcile-cancellations 路由 + crons，或暂维持手动并写入运维 SOP | 质量门神 |
| 3 | 🟡 P2 | 文档一致性 | .env.example | 注释声明 CRON_SECRET + /api/cron/*，但代码无对应实现 | 补路由+校验后文档自洽；否则修正文档避免误导 | 安全卫士 |

---

## ✅ 行动清单

| # | 行动 | 负责方 | 紧急度 | 期望完成 |
|---|------|--------|--------|---------|
| 1 | 创建 `/api/cron/expire-sweep/route.ts`：校验 `CRON_SECRET` Bearer，调用 expire-sweep 逻辑（复用 prisma.user.updateMany） | 主理人（需用户确认方案） | P0 | 合并 main 前 |
| 2 | `apps/web/vercel.json` 增加 `crons: [{ "path": "/api/cron/expire-sweep", "schedule": "0 3 * * *" }]`（reconcile 同理） | 主理人 | P0/P1 | 合并 main 前 |
| 3 | Vercel 环境变量核对：STRIPE_* / CREEM_* / ALIPAY_* / ADMIN_EMAIL / CRON_SECRET / NEXT_PUBLIC_APP_URL / DATABASE_URL / DIRECT_URL 全部配齐 | 用户 | P1 | 上线前 |
| 4 | 重新 push preview → 等 Vercel 部署成功（确认 build 无错，不只 git push 成功） | 用户+主理人 | P1 | 上线前 |
| 5 | 用户说"上线" → 合并 preview→main → 生产部署 | 用户 | - | 用户触发 |

---

## ⚠️ 待完善 / 已知局限
- 本次为**主理人基于源码核查的收口**（用户偏好不派子 Agent），未启动独立子 Agent 重做全量审查；核心阻塞项已通过源码实证确认。
- `expire-sweep.mjs` 将到期用户 `subscriptionExpiryDate` 置 null，会丢失过期时间诊断信息，建议改为保留原值或写入审计日志（次要，可后续优化）。
- 测试套件未覆盖 cron 路由的端到端触发（建议补一个 cron 路由的单测）。

---

## 📚 成员产出索引
- 安全卫士（OWASP+STRIDE 收口确认）：主理人转述，基于上轮 5 轮加固 commit 核查
- 质量门神（部署就绪 + 测试）：主理人转述，基于 vercel.json / 路由 grep / 脚本注释实证

---

> 本报告由软件工坊 AI 协作生成，关键决策请由工程负责人复核。
