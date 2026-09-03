# CookMate 上线前安全审计报告

- 审计模式: Comprehensive（上线前）
- 审计人: gstack-security-officer
- 范围: apps/web 全部 40+ API 路由、NextAuth 配置、支付集成（Stripe/Creem/Alipay）、共享库（shared/）、CI 配置、依赖审计、环境变量管理
- 方法: OWASP Top 10 + STRIDE，全部基于代码证据，无臆测

## 总体结论: 🔴 存在 1 个 Critical 认证绕过，修复前不可上线

## 漏洞清单

### F-001 🔴 Critical — alipay-auth 凭证提供者接受任意 userId（认证绕过/账户接管）
- OWASP A07 / STRIDE: Spoofing | 置信度: 10
- 位置: apps/web/src/lib/auth.ts:239-252；回调 apps/web/src/app/api/auth/callback/alipay/route.ts:115；前端 apps/web/src/app/[locale]/(auth)/login/login-client.tsx:74-77
- 描述: `alipay-auth` Credentials provider 无条件注册，authorize() 仅按 userId 查库即签发 session，无任何凭证校验。支付宝回调把明文 userId 放到 URL 参数 `alipay_auth`，前端再调 signIn("alipay-auth", { userId })。攻击者可直接 POST /api/auth/callback/alipay-auth，用任意已知 userId 登录为该用户。
- 利用场景: 获取任一用户 ID（日志、截图、客服记录、未来任何泄露点）→ 直接换取该用户完整会话 → 再通过 /api/auth/set-password（已登录路径不要求旧密码）设置密码 → /api/user/profile PUT 改绑邮箱 → 受害者彻底失权。完整持久化接管链。
- 修复: 回调路由不要回传明文 userId；改为签发一次性签名令牌（HMAC(userId+exp, AUTH_SECRET)，DB 记录单次使用，5 分钟有效），alipay-auth 的 authorize 校验并核销该令牌。或在回调路由内直接服务端创建 session，完全删除该 Credentials provider。

### F-002 🟠 High — .env.prod 未被 .gitignore 覆盖，随时可能被提交
- OWASP A05/A02 | 置信度: 10
- 位置: 根目录 .gitignore:9-12（仅忽略 .env/.env.local/.env.production/.env.bak）；git status 显示 `?? .env.prod`（未跟踪但未忽略）
- 描述: .env.prod 含 OAuth Client ID、支付宝公钥、Vercel OIDC token、内部域名等。一次 `git add .` 即入库。
- 修复: .gitignore 增加 `.env.prod` 和 `.env.*`（保留 !.env.example 白名单）。

### F-003 🟠 High — proxy.ts 的 /api/auth 限流是死代码；set-password / bind-email 无 OTP 防爆破
- OWASP A07/A04 | 置信度: 9
- 位置: apps/web/src/proxy.ts:80（matcher `/((?!api|_next|_vercel|.*\\..*).*)` 排除了全部 /api 路径，而 34-77 行的限流逻辑只匹配 /api/auth/）
- 描述: matcher 不含 /api，限流分支永远不会执行。/api/auth/set-password（auth/set-password/route.ts:36-48，非会话路径）和 /api/user/bind-email PUT（bind-email/route.ts:96-100）校验 6 位验证码时无 checkOtpRateLimit 调用（forgot-password PUT 和 verify-code-only 有）。6 位验证码、5 分钟有效期、无限尝试 → 可爆破重置任意邮箱账号密码。
- 修复: matcher 改为同时覆盖 /api/auth（如 ["/api/auth/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"]）；给 set-password、bind-email PUT 补上 checkOtpRateLimit/recordOtpAttempt。

### F-004 🟠 High — Creem 订单状态查询接口可被重放用于无限续期 PRO
- OWASP A04/A01 | 置信度: 8
- 位置: apps/web/src/app/api/creem/create-checkout/route.ts:66-139（GET）
- 描述: GET 用用户传入的 checkoutId 调 retrieveCheckout，只要 status==="completed" 就给当前用户升级 PRO 并按现在时间延长 1 月/1 年，无"该 checkout 已消费过"的幂等校验。已付费用户过期后用同一个旧 checkoutId 重复调用即可无限免费续期。另外 `checkoutMeta?.userId && ...` 的写法在 metadata 缺失 userId 时会跳过归属校验。
- 修复: 以 paymentOrder 状态做幂等（仅当订单仍为 PENDING 时升级并标记 PAID）；metadata 缺 userId 时拒绝；金额/产品 ID 与订单比对。

### F-005 🟡 Medium — 内存态限流在 Serverless 多实例下失效
- OWASP A04 | 置信度: 9
- 位置: shared/utils/otp-rate-limit.ts、shared/utils/login-rate-limit.ts、proxy.ts:12-20、demo-login/route.ts:12
- 描述: 全部用进程内 Map。Vercel 多实例/冷启动下锁定计数不共享，暴力破解实际预算 = 5 次 × 实例数 × 冷启动次数。代码注释已自知。
- 修复: 迁移到 Redis/Upstash 或基于 DB 的计数。

### F-006 🟡 Medium — 用户枚举端点
- OWASP A01/A09 | 置信度: 9
- 位置: api/auth/check-password/route.ts（返回 userExists/hasPassword）；api/auth/send-code/route.ts:25-35（login 404 / register 409 区分注册状态）；api/auth/forgot-password/route.ts:28-30
- 描述: 未认证即可探测手机号/邮箱是否注册、是否设有密码，便于定向钓鱼和爆破前侦察。
- 修复: 统一返回中性文案（"如该邮箱已注册，验证码已发送"）；check-password 加 IP 限流。

### F-007 🟡 Medium — 手机号绑定无短信验证
- OWASP A07 | 置信度: 9
- 位置: api/user/profile/route.ts:92-98
- 描述: 凭密码即可把任意手机号绑到自己账号（无短信验证码核验，系统也无短信通道）。可抢占他人手机号阻碍其注册/登录，且 profile 归属信息失真。邮箱改绑同样只验密码、不向新邮箱发验证（bind-email 流程存在但 PUT /user/profile 绕过了它）。
- 修复: 手机号/邮箱改绑一律走验证码确认流程。

### F-008 🟡 Medium — send-code 无 IP 级限流，可被用作邮件轰炸/额度消耗
- OWASP A04 | 置信度: 8
- 位置: api/auth/send-code/route.ts、api/auth/forgot-password/route.ts
- 描述: 仅有"同一邮箱 2 分钟内不重发"限制；攻击者可遍历大量邮箱各发一封，消耗 Resend 额度并骚扰用户。
- 修复: 加 IP/指纹级每日限额 + 验证码（Turnstile 等）。

### F-009 🟡 Medium — Mock 支付宝 OAuth provider 是生产地雷
- OWASP A07 | 置信度: 8
- 位置: apps/web/src/lib/providers/alipay.ts:41-79（token/userinfo 均为 mock，返回固定 alipay_test_user）
- 描述: 当前 .env.prod 未配 AUTH_ALIPAY_PRIVATE_KEY 故未启用；但一旦配置私钥（真实支付上线时必然配置），任何人走 OAuth 流程都会被登录为同一个测试用户/触发账号混乱。且 `checks: []` 关闭了 state/PKCE 校验，存在登录 CSRF。
- 修复: 上线前删除 mock provider 或实现真实 token/userinfo 交换，启用 state 校验。

### F-010 🟢 Low — 支付路由错误响应泄露内部错误详情
- OWASP A05/A09 | 置信度: 8
- 位置: stripe/webhook/route.ts:100、stripe/create-checkout/route.ts:79、creem/create-checkout/route.ts:59,136、alipay/create/route.ts:54
- 描述: error.message 直接回传客户端，可能含 Stripe/Creem API 内部细节。
- 修复: 对外返回固定文案，细节仅记服务端日志。

### F-011 🟢 Low — 支付宝异步通知未校验金额
- OWASP A04 | 置信度: 6
- 位置: api/alipay/notify/route.ts:35-56
- 描述: 验签+app_id+trade_status 完备，但未比对 total_amount 与订单金额、seller_id。当前金额由服务端签名生成，风险低，属纵深防御缺口。
- 修复: 校验 params.total_amount === order.amount/100。

### F-012 🟢 Low — demo cookie 缺 Secure 标志
- OWASP A02 | 置信度: 9
- 位置: shared/utils/demo-cookie.ts:111
- 描述: HttpOnly+SameSite=Lax 有，缺 Secure，HTTP 下明文传输（生产 HTTPS 有 HSTS 缓解）。
- 修复: 生产环境追加 `; Secure`。

### F-013 🟢 Low — CSP 含 'unsafe-inline' 'unsafe-eval'
- OWASP A05 | 置信度: 8
- 位置: apps/web/next.config.ts（script-src 'self' 'unsafe-inline' 'unsafe-eval'）
- 描述: 其余安全头（HSTS/X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy/frame-ancestors/object-src 'none'）齐全；script-src 过宽削弱 XSS 防线。dangerouslySetInnerHTML 仅用于静态 i18n 文案（OnboardingWizard/orders 图标），当前无用户输入流入，XSS 实际风险低。
- 修复: 逐步迁移 nonce-based CSP。

### F-014 🟢 Low — .env.local 含真实 Neon 生产库凭证（明文落盘）
- OWASP A02 | 置信度: 8
- 位置: .env.local（git 已忽略、git 历史无泄露——已验证）
- 描述: 开发机明文存储生产数据库用户名/密码与 AUTH_SECRET。机器或备份外泄即库沦陷。
- 修复: 建议轮换该 DB 密码与 AUTH_SECRET；开发环境改用独立开发库。

### F-016 🟢 Low — demo-login 限流逻辑本身失效
- OWASP A04 | 置信度: 10（与 product-reviewer 交叉验证）
- 位置: api/auth/demo-login/route.ts:19-28
- 描述: demoRateMap 每 IP 仅存单个时间戳，count 恒 ≤1，永远达不到上限 20，限流完全不生效。
- 修复: 改为 Map<ip, number[]> 或复用 login-rate-limit 计数模式。

### F-017 🟡 Medium — 账号删除后 JWT 会话仍有效
- OWASP A07 | 置信度: 9（与 product-reviewer 交叉验证）
- 位置: lib/auth.ts:459-495（session/jwt 回调）；api/user/delete/route.ts
- 描述: session 回调直接以 token.sub 签发会话；jwt 回调查不到用户时仅回落 FREE，不使会话失效。删除账号后旧 JWT（默认 30 天）仍形式上有效。
- 修复: jwt/session 回调中用户不存在时使会话失效；user/delete 成功后清除 session cookie。

### F-015 🟢 Info — next-auth v5 beta 用于生产
- 位置: apps/web/package.json（next-auth ^5.0.0-beta.32）
- 描述: beta 版本可能有未修复的认证边界问题，需关注升级。

## 合规亮点
- Stripe webhook 生产环境 fail-closed 验签；Creem HMAC-SHA256 + timingSafeEqual 且密钥缺失时拒绝；支付宝 RSA2 验签 fail-closed（公钥缺失直接拒绝）
- demo cookie 已改 HMAC 签名、过期校验、fail-closed
- 密码 bcrypt(10) 哈希；验证码 crypto.randomInt；一次性使用后标记 used
- 资源路由（recipes/pantry/meal-plan/orders/grocery-list/settings/export）普遍做了 session + userId 归属校验，IDOR 防护到位
- 安全响应头齐全；Prisma 全参数化查询（无 $queryRaw）；无 dangerouslySetInnerHTML 注入用户数据
- pnpm audit 无已知漏洞；git 历史无 .env 泄露；CI 无 pull_request_target 危险用法
- 数据导出接口手机号脱敏；demo 用户与真实 OAuth 账号隔离设计
- 关联账号流程（signIn 回调拦截 + AsyncLocalStorage 读会话）设计严谨，防越绑

## 上线前阻塞项（必须修复）
1. F-001（Critical）alipay-auth 任意 userId 登录
2. F-002 .env.prod 加入 .gitignore
3. F-003 限流 matcher 修复 + set-password/bind-email 补 OTP 防爆破
4. F-004 Creem GET 升级幂等
5. F-009 删除/修复 mock 支付宝 provider（随真实支付上线触发）
