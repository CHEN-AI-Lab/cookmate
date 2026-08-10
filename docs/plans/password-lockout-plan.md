# CookMate 密码登录锁定功能规划

> 只改密码登录，不改其他登录注册逻辑

## 改动清单

### 1. 新建 `apps/web/src/lib/login-rate-limit.ts`
从 AAIGC 复制共享模块，内存 Map 记录失败次数，5 次失败后锁定 15 分钟。

### 2. 修改 `apps/web/src/lib/auth.ts`
在 password Credentials provider（第 141-170 行）的 authorize 函数中：
- 调用 `checkLoginRateLimit()` 检查是否锁定
- 调用 `recordLoginAttempt()` 记录失败/成功
- 被锁定时返回 null（登录失败）

### 3. 新建 `api/auth/check-lockout/route.ts`
GET 接口，传入 `account`（邮箱或手机号），返回是否锁定 + 剩余分钟数。

### 4. 修改 `apps/web/src/app/[locale]/(auth)/login/login-client.tsx`
在密码登录的 handleLogin 函数中：
- 调用 signIn 前先调 `check-lockout` API
- 被锁定 → 显示锁定提示（含剩余分钟数）
- signIn 失败后 → 再查一次，剩余次数 < 3 时显示剩余次数

### 5. 翻译 key 补充
- `errors.accountLocked` — 锁定提示，含 `{minutes}` 占位符
- `errors.attemptsRemaining` — 剩余次数提示，含 `{count}` 占位符

## 不改的
- 手机号验证码登录（phone provider）
- 邮箱验证码登录（email provider）
- OAuth 登录（Google/GitHub）
- 注册流程
- 忘记密码流程
- 其他所有登录注册逻辑