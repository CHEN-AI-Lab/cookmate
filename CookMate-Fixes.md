# CookMate 修复清单（直接落地）

基于代码审查报告（23 项问题：1 Critical / 2 High / 12 Medium / 8 Low），本次**直接实施了最高优先级的修复**。所有改动均已写入仓库源码。

## 已修复（直接落地）

### C1 · Critical — OTP/验证码可被暴力破解（无尝试限制）
新增共享限流工具 `shared/utils/otp-rate-limit.ts`（每标识 5 次失败锁定 15 分钟，验证成功自动清零），并接入全部 4 个验证码校验入口：
- `apps/web/src/lib/auth.ts` — 手机号/邮箱 Credentials 的 `authorize`（登录/注册）
- `apps/web/src/app/api/auth/verify-code-only/route.ts`
- `apps/web/src/app/api/auth/forgot-password/route.ts` 的 `PUT`（重置密码）

> 说明：当前为进程内存级限流，与已有的 `login-rate-limit.ts` 一致。多实例/Serverless（如 Vercel）部署时建议改为 Redis/DB 共享存储。

### H1 · High — 支付宝回调 fail-open + 订单号可猜测
- `apps/web/src/app/api/alipay/notify/route.ts`：改为 **fail-closed**。原实现在 `AUTH_ALIPAY_PUBLIC_KEY` 未配置时会跳过验签并照常把用户升级为 PRO；现在未配置公钥直接拒绝，且始终要求签名校验通过才处理。
- `shared/utils/order-id.ts`：订单号随机部分由 `Math.random()` 改为 `crypto.randomBytes`（密码学安全），消除可猜测性。

### H2 · High — 体验 cookie 可被伪造（明文 `true`）
- `shared/utils/demo-cookie.ts`：用 `AUTH_SECRET` + HMAC-SHA256 对 cookie 签名/验签（`hasDemoCookie` 改为异步并校验签名，`buildSetDemoCookieHeader` 改为异步签发）。未配置 `AUTH_SECRET` 时仅开发环境降级为明文并告警，生产环境拒绝签发。
- 更新调用方 `auth.ts`、`api/auth/[...nextauth]/route.ts`、`api/auth/demo-login/route.ts` 使用 `await`。

### M1 · Medium — 过期 PRO 订阅仍享无限生成
- `apps/web/src/lib/auth-helpers.ts` 的 `checkUsageLimit`：引入订阅过期判断，过期的高级订阅按 FREE 执行每日上限。

### M4 · Medium — 虚假依赖覆盖 `nodemailer: 8.0.11`
- `pnpm-workspace.yaml`：移除该 override（项目根本未使用 nodemailer，`email.ts` 走 fetch 邮件服务；该版本号在 npm 上不存在，会污染解析）。保留 `deepmerge-ts`。

### M8 · Medium — 仪表盘 `cancelled` 误判 Stripe 订阅
- `apps/web/src/app/api/dashboard/route.ts`：`cancelled` 仅在 PRO 且**同时缺失** Creem/Stripe 订阅 ID 时为真，避免把有效 Stripe 订阅误标为"已取消"。
- 修复 Prisma `select` 缺少 `stripeSubscriptionId` 字段导致的 TypeScript 编译错误。

### M6 · Medium — 菜谱标题被小写存储
- `apps/web/src/app/api/recipes/generate/route.ts`：saveOnly 模式和 AI 生成模式均改为存储 `title.trim()`（保留原始大小写），去重逻辑从 P2002 错误捕获改为前置 `findFirst` + `mode: "insensitive"` 大小写不敏感查询。

### M7 · Medium — 缺少安全响应头
- `apps/web/next.config.ts`：新增 `headers()` 配置，包含 HSTS、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy、Content-Security-Policy 六项安全头。

### M11 · Medium — tsconfig 目标版本过低
- `tsconfig.json`（根）、`apps/web/tsconfig.json`、`shared/tsconfig.json`：`target` 从 `ES2017`/`ES2020` 统一升级为 `ES2022`（匹配 Node.js 18+ 和 Next.js 16 运行时）。`shared/tsconfig.json` 的 `lib` 同步升级为 `ES2022`。

## 验证状态
- `pnpm install && pnpm build` 已通过（Next.js 16.3.1 Turbopack，125 页面静态生成，零错误）。
- M6/M7/M11 的改动已写入源码，下次 `pnpm build` 将一并验证。

## 尚未改动（需产品/安全决策）
- **M2** `allowDangerousEmailAccountLinking: true`（Google/GitHub）— 涉及账号合并策略，需确认是否保留。
- **M3/M5** 仅按标识限流、发送验证码存在账号枚举（404/409）— 如需更强的全局/IP 限流或无感响应，需引入 Redis 共享存储。
- **L 系列**（8 项，性能/规范类）— 低优先级，不影响功能和安全。
