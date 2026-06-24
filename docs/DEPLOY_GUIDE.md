# CookMate 完整部署指南（零基础版）

> **适用人群**：完全零基础、没接触过服务器和命令行的新手。本文档从购买服务器开始，手把手带你完成 CookMate 的全部部署流程。
>
> **预计总耗时**：2~3 小时（含等待 DNS 生效和镜像构建的时间）
>
> **预计总花费**：约 68~100 元/月（服务器） + 约 10 元（DeepSeek AI 预充值） + 约 30~60 元/年（域名） + 其他服务免费或按量付费

---

## 一、部署前需要准备什么（总览）

在开始部署之前，你需要准备好以下所有东西。下面用表格列出每一项：

| 序号 | 名称 | 用途 | 是否必须 | 费用估算 |
|------|------|------|----------|----------|
| 1 | 云服务器（1台） | 运行 CookMate 应用 | ✅ 必须 | 68~100 元/月（阿里云/腾讯云轻量服务器） |
| 2 | 域名（1个） | 让用户通过网址访问 | ✅ 必须 | 30~60 元/年（.com 域名约 60 元/年） |
| 3 | Neon PostgreSQL | 数据库，存储用户和菜谱数据 | ✅ 必须 | 免费（免费额度足够个人/小团队使用） |
| 4 | DeepSeek AI | AI 生成菜谱功能 | ✅ 必须 | 按量计费，先充 10 元够用很久 |
| 5 | QQ 邮箱 SMTP | 发送邮箱验证码 | ✅ 必须 | 免费 |
| 6 | 阿里云短信服务 | 发送手机验证码 | 二选一 | 0.045 元/条，预充 10 元够测试 |
| 7 | Stripe | 国际信用卡支付（国外用户） | 可选 | 按交易抽成 2.9%+$0.30 |
| 8 | PayJS | 国内微信/支付宝支付 | 可选 | 按交易抽成，约 1%~2% |

**最小的可以跑起来的组合**（只要 1~5 项）：
- 1 台服务器 + 1 个域名 + Neon 数据库 + DeepSeek AI + QQ 邮箱 = **约 80 元/月就能运行**

> **说明**：手机短信验证码（阿里云短信）和邮箱验证码（QQ邮箱SMTP）二选一即可让用户登录。推荐先配邮箱（免费），后续有需要再加短信。

---

## 二、第一步：购买云服务器

### 2.1 选择云服务商

推荐以下两家（国内访问速度快，新手友好）：

| 服务商 | 推荐产品 | 最低配置价格 |
|--------|----------|-------------|
| 阿里云 | 轻量应用服务器（Lighthouse） | 约 68 元/月 |
| 腾讯云 | 轻量应用服务器（Lighthouse） | 约 68 元/月 |

两者操作流程几乎一样，本文以**阿里云**为例。

### 2.2 配置要求

| 配置项 | 最低要求 |
|--------|----------|
| CPU | 2 核 |
| 内存 | 2 GB |
| 硬盘 | 40 GB 以上 |
| 操作系统 | **Ubuntu 22.04 LTS**（推荐）或 CentOS 7.9 |
| 带宽 | 3 Mbps 以上 |

### 2.3 购买步骤（图文操作）

**第 1 步：注册账号**

打开浏览器，访问 https://www.aliyun.com ，点击右上角「免费注册」。
- 输入手机号 → 获取验证码 → 设置密码 → 完成注册。

**第 2 步：实名认证**

注册完成后，阿里云会提示进行实名认证（这是国家规定，不认证无法购买服务器）。
- 点击「实名认证」→ 选择「个人实名认证」→ 用支付宝或银行卡完成认证。
- 认证通常几分钟内完成。

**第 3 步：购买轻量应用服务器**

1. 在阿里云首页搜索框输入「轻量应用服务器」，点击进入。
2. 点击「立即购买」。
3. 在地域选择中，选择离你最近的（比如「华东1（杭州）」或「华南1（深圳）」）。
4. 镜像选择：
   - 点击「系统镜像」标签
   - 选择 **Ubuntu 22.04**（推荐）
5. 套餐配置：选择「2核2G内存、40GB SSD、3Mbps带宽」，约 68 元/月。
6. 购买时长：建议先买 1 个月测试，满意后再续费。
7. 点击「立即购买」→ 确认订单 → 付款。

**第 4 步：获取服务器 IP 和密码**

购买成功后：
1. 进入阿里云控制台 → 点击「轻量应用服务器」。
2. 你会看到刚购买的服务器列表，记录下 **公网 IP 地址**（格式如 `47.xxx.xxx.xxx`）。
3. 点击服务器名称进入详情页 → 左侧菜单「远程连接」→ 可以在这里重置 root 密码。
4. 设置一个自己记得住的密码（包含大小写字母和数字，如 `MyServer2024!`）。

记录下来：
```
服务器IP：47.xxx.xxx.xxx
root密码：你自己设置的密码
```

### 2.4 通过 SSH 连接到服务器

SSH 是远程登录服务器的工具。

**如果你用 Windows**：

打开「命令提示符」（CMD）或 PowerShell：
- 按键盘 `Win + R`，输入 `cmd`，回车。

在窗口中输入以下命令（把 `47.xxx.xxx.xxx` 换成你的服务器 IP）：
```bash
ssh root@47.xxx.xxx.xxx
```

第一次连接会提示"是否确认连接"，输入 `yes` 回车。
然后输入你设置的 root 密码（输入时不会显示任何字符，这是正常的），回车。

**如果你用 Mac**：

打开「终端」（Terminal，在启动台里搜索即可），输入同样的命令：
```bash
ssh root@47.xxx.xxx.xxx
```

登录成功后，你会看到类似 `root@iZxxx:~#` 的提示符，说明你已经进入服务器了。

### 2.5 安装 Docker

Docker 是运行 CookMate 所需的基础环境。登录服务器后，依次执行以下命令：

**第 1 步：更新系统软件包**
```bash
apt update -y
```

**第 2 步：安装必要依赖**
```bash
apt install -y ca-certificates curl gnupg lsb-release
```

**第 3 步：添加 Docker 官方源的 GPG 密钥**
```bash
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

**第 4 步：添加 Docker 软件源**
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**第 5 步：安装 Docker**
```bash
apt update -y
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**第 6 步：验证安装**
```bash
docker --version
docker compose version
```
如果显示版本号（如 `Docker version 26.x.x`），说明安装成功。

**第 7 步：设置 Docker 开机自启**
```bash
systemctl enable docker
systemctl start docker
```

---

## 三、第二步：购买域名 + 配置 DNS

### 3.1 购买域名

**推荐平台**：阿里云万网（https://wanwang.aliyun.com）或腾讯云 DNSPod（https://dnspod.cn）。

**购买流程**：
1. 打开 https://wanwang.aliyun.com （阿里云万网）。
2. 在搜索框输入你想要的域名，如 `mycookmate.com`，点击「查域名」。
3. 如果显示「未注册」，加入购物车。
4. 去购物车结算，选择 1 年（.com 约 60 元/年）。
5. 付款前需要完成域名实名认证（填身份证信息），提交后通常几分钟到几小时审核通过。

### 3.2 配置 DNS 解析

域名买好后，需要把域名「指向」你的服务器 IP，这样浏览器访问域名时才能打开你的网站。

**第 1 步：进入 DNS 解析管理**

在阿里云控制台 → 搜索「云解析 DNS」→ 点击进入 → 找到你的域名 → 点击「解析设置」。

**第 2 步：添加 A 记录**

点击「添加记录」，填写以下内容：

| 字段 | 填写内容 |
|------|----------|
| 记录类型 | A |
| 主机记录 | @ |
| 记录值 | 你的服务器 IP（如 `47.xxx.xxx.xxx`） |
| TTL | 默认 600 即可 |

然后点击「确定」。

**第 3 步：再添加一条 www 记录**（让 www.你的域名.com 也能访问）

再次点击「添加记录」：

| 字段 | 填写内容 |
|------|----------|
| 记录类型 | A |
| 主机记录 | www |
| 记录值 | 你的服务器 IP（同上面一样） |
| TTL | 默认 600 即可 |

添加完成后，你的解析记录应该显示两条：

| 主机记录 | 记录类型 | 记录值 |
|----------|----------|--------|
| @ | A | 47.xxx.xxx.xxx |
| www | A | 47.xxx.xxx.xxx |

### 3.3 DNS 生效时间

DNS 解析添加后，不是立即生效的。一般在 **几分钟到 2 小时** 内逐渐生效。你可以等后面部署完成后再测试，这样时间刚好。

---

## 四、第三步：注册数据库（Neon PostgreSQL）

### 4.1 Neon 是什么？为什么用它？

Neon 是一个免费的云端 PostgreSQL 数据库服务。相比于自己安装维护数据库，它有这些优点：

- **免费**：免费版提供 0.5GB 存储，对个人项目完全够用
- **免运维**：不用自己安装、备份、升级数据库
- **全球部署**：访问速度快
- **自带分支功能**：适合测试和开发

### 4.2 注册和创建数据库

**第 1 步：访问 Neon**

打开浏览器，访问 https://neon.tech

**第 2 步：注册账号**

点击首页的「Sign Up」按钮 → 选择用 GitHub 或 Google 账号登录（推荐 GitHub，国内也能访问）。

**第 3 步：创建 Project**

登录后，Neon 会自动引导你创建第一个项目（Project）：
1. Project name 填 `cookmate`（或任意名字）。
2. 数据库名默认是 `neondb`，不用改。
3. Region（区域）选择离你最近的，比如 `Asia Pacific (Singapore)`。
4. 点击「Create Project」。

**第 4 步：获取连接字符串**

创建完成后，Neon 会展示一个连接面板。你会看到类似这样的连接字符串：

```
postgresql://cookmate_owner:xxxxxxxxxxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

点击「Copy」按钮复制这串字符，**保存到记事本里**。

> **重要**：这串字符就是后面要填的 `DATABASE_URL`，包含了数据库的用户名和密码，请妥善保管不要泄露。

---

## 五、第四步：注册 AI 服务（DeepSeek）

CookMate 使用 AI 来生成菜谱，需要接入一个 AI 大模型服务。推荐使用 **DeepSeek**（国产大模型，性价比高）。

### 5.1 注册 DeepSeek

1. 打开浏览器，访问 https://platform.deepseek.com
2. 点击「注册」→ 输入手机号或邮箱 → 获取验证码 → 完成注册。
3. 注册后登录进入控制台。

### 5.2 创建 API Key

1. 在左侧菜单点击「API Keys」。
2. 点击「创建新的 API Key」。
3. 给 Key 取个名字，如 `cookmate`。
4. 点击「创建」→ **立刻复制并保存**！Key 只显示一次，关闭后就看不到了。

Key 的格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5.3 充值

1. 在左侧菜单点击「充值」或「Billing」。
2. 建议先充 **10 元** 用于测试。
3. 支持微信/支付宝支付。

> DeepSeek 价格非常便宜，10 元够生成几百道菜谱。

### 5.4 记录以下信息

把下面三项记下来，后面要填到环境变量里：

| 项目 | 值 |
|------|----|
| API Key | `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Base URL | `https://api.deepseek.com` |
| Model | `deepseek-chat` |

---

## 六、第五步：注册邮件服务（QQ 邮箱 SMTP）

CookMate 需要通过邮箱发送登录验证码。推荐使用 **QQ 邮箱 SMTP**（免费、配置简单）。

> **如果不想用 QQ 邮箱**，也可以用 163 邮箱、Gmail 等，流程类似。只需要知道 SMTP 服务器地址、端口、邮箱账号和授权码即可。

### 6.1 开启 QQ 邮箱 SMTP 服务

1. 在浏览器打开 https://mail.qq.com ，登录你的 QQ 邮箱。
2. 点击页面顶部的「设置」→ 切换到「账户」标签。
3. 往下滚动，找到「POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务」区域。
4. 找到「POP3/SMTP服务」这一行 → 点击右侧的「开启」。
5. 按照提示发送短信到指定号码（免费）→ 发送后会弹出**授权码**。
6. **立刻复制这个授权码**（是一串 16 位字母，如 `abcdefghijklmnop`），保存到记事本。

> ⚠️ **特别注意**：授权码**不是**你的 QQ 密码！它是一个独立的、专门用于第三方邮件客户端的密码。

### 6.2 记录以下信息

| 项目 | 值 |
|------|----|
| SMTP 服务器 | `smtp.qq.com` |
| 端口 | `465`（SSL 加密） |
| 发件邮箱地址 | 你的完整 QQ 邮箱，如 `123456789@qq.com` |
| 授权码 | 刚才复制的那串 16 位字母 |
| 发件人显示名 | `CookMate <123456789@qq.com>` |

---

## 七、第六步：注册支付服务（可选）

> **这一整章都是可选的。** 如果你暂时不需要付费订阅功能，可以直接跳过，CookMate 的核心功能（AI 生成菜谱、食材管理、膳食计划）都不需要支付。

CookMate 支持两种支付方式：
- **Stripe**：面向国外用户的国际信用卡支付（Visa、Mastercard 等）
- **PayJS**：面向国内用户的微信支付 / 支付宝

你只需要配置其中一个即可，也可以两个都不配。

### 7.1 Stripe（国际信用卡支付，可选）

#### 注册

1. 访问 https://dashboard.stripe.com/register 注册账号。
2. 填写邮箱、姓名、国家（选 China）、密码。
3. 激活账号：Stripe 会要求填写一些商家信息（可以用个人身份注册）。

#### 获取 API Keys

1. 登录 Stripe Dashboard，左侧菜单点击「Developers」→「API keys」。
2. 你会看到两个 Key：
   - **Publishable key**：以 `pk_live_` 开头
   - **Secret key**：以 `sk_live_` 开头（点击「Reveal」显示）
3. 复制这两个 Key 保存。

#### 创建产品和价格

1. 左侧菜单点击「Products」→「Add product」。
2. 创建月度订阅产品：
   - Name: `CookMate Pro - Monthly`
   - Price: 填写你的定价（如 29 元/月）
   - Billing period: Monthly
   - 点击「Save product」
3. 创建后，在产品详情页找到 **Price ID**（格式如 `price_xxxxxxxxxxxx`），复制保存。
4. 同样操作再创建一个年度订阅产品（Name: `CookMate Pro - Yearly`，Billing period: Yearly），获取其 Price ID。

#### 配置 Webhook

Webhook 是 Stripe 在支付成功后通知你服务器的机制。

1. 左侧菜单点击「Developers」→「Webhooks」→「Add endpoint」。
2. Endpoint URL 填写：`https://你的域名.com/api/stripe/webhook`
   - （例如域名是 `mycookmate.com`，就填 `https://mycookmate.com/api/stripe/webhook`）
3. Events to send：选择 `checkout.session.completed`。
4. 点击「Add endpoint」。
5. 创建后，点击「Reveal」查看 **Signing secret**（以 `whsec_` 开头），复制保存。

#### 记录以下信息

| 项目 | 值 |
|------|----|
| Secret Key | `sk_live_xxxxxxxxxxxx` |
| Publishable Key | `pk_live_xxxxxxxxxxxx` |
| Pro 月度 Price ID | `price_xxxxxxxxxxxx` |
| Pro 年度 Price ID | `price_yyyyyyyyyyyy` |
| Webhook Signing Secret | `whsec_xxxxxxxxxxxx` |

---

### 7.2 PayJS（国内微信支付，可选）

> **注意**：PayJS 是第三方聚合支付平台，需要企业或个体工商户资质才能开通微信支付。个人用户建议先跳过，等有营业执照再配。

#### 注册

1. 访问 https://payjs.cn ，点击「注册」。
2. 填写信息，完成注册和实名认证。

#### 获取商户信息

登录 PayJS 后台后，在首页或设置页面可以看到：
- **商户号（MCHID）**
- **密钥（KEY）**

复制这两个信息保存。

#### 配置支付通知地址

在 PayJS 后台的「通知设置」中，填写通知地址：
```
https://你的域名.com/api/payment/notify
```

#### 记录以下信息

| 项目 | 值 |
|------|----|
| 商户号 (MCHID) | `payjs 商户号` |
| 密钥 (KEY) | `payjs 密钥` |
| 通知地址 | `https://你的域名.com/api/payment/notify` |

---

## 八、第七步：填写环境变量文件

环境变量文件（`.env.production`）包含了 CookMate 运行所需的所有配置参数。你现在需要把前面各步骤获取的信息填入这个文件。

### 8.1 文件位置

项目中的环境变量模板文件是 `.env.production`，你需要把它从本地复制到服务器并填写内容。

### 8.2 逐项填写说明

打开 `.env.production` 文件（可以用记事本或任何文本编辑器），按照下面的表格逐项替换占位符：

#### 数据库

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `DATABASE_URL` | Neon 连接字符串，格式：`"postgresql://user:pass@host.neon.tech/db?sslmode=require"` | Neon 控制台（第四章） | ✅ 必须 |

示例：
```
DATABASE_URL="postgresql://cookmate_owner:xxxxxxxxxxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

#### NextAuth 安全密钥

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `AUTH_SECRET` | 随机字符串 | 在服务器上运行 `openssl rand -base64 32` 生成 | ✅ 必须 |

生成方法：在服务器上执行：
```bash
openssl rand -base64 32
```
把输出结果填入。

#### 社交登录（可选）

| 变量名 | 填什么 | 是否必须 |
|--------|--------|----------|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | 可选 |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | 可选 |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | 可选 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | 可选 |

> 如果不配 Google/GitHub 登录，留空即可。用户依然可以通过邮箱验证码和 Demo 体验登录。

#### 邮箱验证码

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `EMAIL_HOST` | `"smtp.qq.com"` | 第六章 | ✅ 必须 |
| `EMAIL_PORT` | `"465"` | 第六章 | ✅ 必须 |
| `EMAIL_USER` | `"123456789@qq.com"` | 你的 QQ 邮箱地址 | ✅ 必须 |
| `EMAIL_PASS` | `"授权码"` | QQ 邮箱的 SMTP 授权码 | ✅ 必须 |
| `EMAIL_FROM` | `"CookMate <123456789@qq.com>"` | 自定义显示名称 | ✅ 必须 |

示例：
```
EMAIL_HOST="smtp.qq.com"
EMAIL_PORT="465"
EMAIL_USER="123456789@qq.com"
EMAIL_PASS="abcdefghijklmnop"
EMAIL_FROM="CookMate <123456789@qq.com>"
```

#### 短信验证码（二选一，与邮箱选一个即可）

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 RAM AccessKey ID | 阿里云控制台 → RAM访问控制 | 可选 |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 RAM AccessKey Secret | 同上 | 可选 |
| `ALIYUN_SIGN_NAME` | `"CookMate"` | 阿里云短信服务 → 签名管理 | 可选 |
| `ALIYUN_TEMPLATE_CODE` | 短信模板CODE | 阿里云短信服务 → 模板管理（如 `SMS_123456789`） | 可选 |

> 如果暂时不配短信、只配了邮箱，把这几项留空即可。只配邮箱用户也能用邮箱验证码登录。

#### AI

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `AI_API_KEY` | `"sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"` | DeepSeek 后台（第五章） | ✅ 必须 |
| `AI_BASE_URL` | `"https://api.deepseek.com"` | DeepSeek 文档 | ✅ 必须 |
| `AI_MODEL` | `"deepseek-chat"` | DeepSeek 文档 | ✅ 必须 |

示例：
```
AI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AI_BASE_URL="https://api.deepseek.com"
AI_MODEL="deepseek-chat"
```

#### Stripe 支付（可选）

| 变量名 | 填什么 | 是否必须 |
|--------|--------|----------|
| `STRIPE_SECRET_KEY` | `"sk_live_xxxxxxxxxxxx"` | 可选 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `"pk_live_xxxxxxxxxxxx"` | 可选 |
| `STRIPE_PRO_PRICE_ID` | `"price_xxxxxxxxxxxx"` | 可选 |
| `STRIPE_WEBHOOK_SECRET` | `"whsec_xxxxxxxxxxxx"` | 可选 |

> 不配 Stripe 就留空，不影响核心功能。

#### PayJS 支付（可选）

| 变量名 | 填什么 | 是否必须 |
|--------|--------|----------|
| `PAYJS_MCHID` | `"你的商户号"` | 可选 |
| `PAYJS_KEY` | `"你的密钥"` | 可选 |
| `PAYJS_NOTIFY_URL` | `"https://你的域名.com/api/payment/notify"` | 可选 |

#### 应用地址

| 变量名 | 填什么 | 从哪里获取 | 是否必须 |
|--------|--------|------------|----------|
| `NEXT_PUBLIC_APP_URL` | `"https://你的域名.com"` | 你购买的域名（第三章） | ✅ 必须 |

示例：
```
NEXT_PUBLIC_APP_URL="https://mycookmate.com"
```

---

## 九、第八步：上传项目到服务器

### 9.1 在服务器上安装 Git

通过 SSH 连接到服务器后，执行：
```bash
apt install git -y
```

验证安装：
```bash
git --version
```

### 9.2 克隆项目

> **注意**：下面命令中的 `YOUR_REPO_URL` 请替换为你实际的 Git 仓库地址。

```bash
cd /opt
git clone YOUR_REPO_URL cookmate
cd cookmate
```

> 如果你的项目还没有上传到 GitHub/GitLab，可以用 SCP 命令从本地上传（见 9.4 节）。

### 9.3 把填好的 .env.production 上传到服务器

确保你已经按照第八章的说明，在本地把 `.env.production` 文件的所有占位符都替换成了真实值。

**方法一：在服务器上直接用 vim 编辑**

```bash
cd /opt/cookmate
vim .env.production
```

1. 按 `i` 键进入编辑模式。
2. 把本地的 `.env.production` 内容粘贴进来。
3. 按 `Esc` 键退出编辑模式。
4. 输入 `:wq` 后回车，保存并退出。

vim 常用操作提示：
- `i`：进入编辑模式
- `Esc`：退出编辑模式
- `:wq`：保存并退出
- `:q!`：不保存退出

如果你不会用 vim，也可以装 nano：
```bash
apt install nano -y
nano .env.production
```
编辑完成后按 `Ctrl+X`，然后按 `Y`，再按 `Enter` 保存。

**方法二：从本地上传（SCP）**

在你**本地电脑**（不是服务器）的终端中执行：
```bash
scp 本地路径/.env.production root@你的服务器IP:/opt/cookmate/.env.production
```

例如（Windows 用户，假设文件在桌面）：
```powershell
scp C:\Users\你的用户名\Desktop\.env.production root@47.xxx.xxx.xxx:/opt/cookmate/.env.production
```

Mac 用户：
```bash
scp ~/Desktop/.env.production root@47.xxx.xxx.xxx:/opt/cookmate/.env.production
```

### 9.4 验证配置

在服务器上确认文件已上传且内容正确：
```bash
cat /opt/cookmate/.env.production
```

检查显示的每个变量是否都已填写，没有 `YOUR_xxx_HERE` 占位符残留。

---

## 十、第九步：替换数据库 Schema

CookMate 项目默认使用 SQLite 数据库（用于本地开发），生产环境需要切换到 PostgreSQL。项目已经准备好了 PostgreSQL 版本的 Schema 文件，只需要用文件替换命令即可：

```bash
cd /opt/cookmate
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

验证替换成功：
```bash
head -5 prisma/schema.prisma
```

输出应该包含 `provider = "postgresql"` 而不是 `provider = "sqlite"`：
```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 十一、第十步：启动项目

### 11.1 构建并启动

在服务器上执行以下命令（确保当前目录在 `/opt/cookmate`）：

```bash
cd /opt/cookmate
docker compose up -d --build
```

参数说明：
- `up`：启动服务
- `-d`：后台运行（detached mode）
- `--build`：构建镜像（第一次启动必须加这个）

**等待 3~5 分钟**，第一次构建需要下载 Docker 镜像和安装依赖，会比较慢。你会看到很多行日志输出，这是正常的。

### 11.2 检查运行状态

构建完成后，检查容器是否正常运行：

```bash
docker compose ps
```

正常的话应该看到类似这样的输出：

```
NAME           IMAGE            STATUS                    PORTS
cookmate-app   cookmate-app     Up (healthy)             0.0.0.0:3000->3001/tcp
```

> **关键**：STATUS 列必须显示 `Up (healthy)`，如果显示 `Up` 但没有 `(healthy)`，说明健康检查还没通过，再等 30 秒左右。

### 11.3 验证应用是否正常

在服务器上执行：
```bash
curl http://localhost:3000/api/health
```

如果返回 `{"status":"ok"}` 或类似的 JSON 响应，说明 CookMate 应用已经成功运行！

如果返回错误：
```bash
# 查看容器日志
docker compose logs app

# 查看最近 50 行日志
docker compose logs app --tail 50
```

---

## 十二、第十一步：配置 Nginx + SSL 证书

当前应用运行在服务器的 `3000` 端口上，但用户需要通过标准的 80（HTTP）和 443（HTTPS）端口访问。Nginx 就是用来做这个「端口转发」的。

### 12.1 安装 Nginx

```bash
apt install nginx -y
```

### 12.2 创建 Nginx 配置文件

```bash
vim /etc/nginx/conf.d/cookmate.conf
```

按 `i` 进入编辑模式，粘贴以下内容（把 `mycookmate.com` 改成你的域名）：

```nginx
server {
    listen 80;
    server_name mycookmate.com www.mycookmate.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 对 API 和 Next.js 路由不缓存
        proxy_buffering off;
    }
}
```

按 `Esc` 退出编辑模式，输入 `:wq` 回车保存。

### 12.3 测试 Nginx 配置

```bash
nginx -t
```

如果显示 `syntax is ok` 和 `test is successful`，说明配置正确。

### 12.4 启动 Nginx

```bash
systemctl start nginx
systemctl enable nginx
```

### 12.5 安装 Certbot 并申请免费 SSL 证书

Let's Encrypt 提供免费的 SSL 证书，通过 Certbot 工具可以一键获取。

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx -y

# 申请证书（把 mycookmate.com 换成你的域名）
certbot --nginx -d mycookmate.com -d www.mycookmate.com
```

执行过程中的交互：
1. 输入你的**邮箱地址**（用于接收证书到期通知）→ 回车。
2. 同意服务条款：输入 `A` 回车（或 `Y`）。
3. 是否接收推广邮件：输入 `N` 回车。
4. 等待自动配置完成。

成功后你会看到 `Congratulations!` 的提示，说明 HTTPS 已经配置好了。

### 12.6 设置证书自动续期

Let's Encrypt 证书有效期 90 天，Certbot 默认会自动续期。验证自动续期是否正常：

```bash
certbot renew --dry-run
```

如果没有报错，说明自动续期已配置好。

---

## 十三、验证部署成功

### 13.1 访问首页

在浏览器地址栏输入：
```
https://你的域名.com
```

你应该看到 CookMate 的首页，包含：
- 标题/Logo
- 「体验 Demo」按钮
- 功能介绍区块

### 13.2 测试 Demo 登录

1. 点击首页的「体验 Demo」按钮（或直接访问 `https://你的域名.com/login`）。
2. 点击「体验登录」按钮。
3. 成功进入仪表盘（Dashboard），说明认证系统正常。

### 13.3 测试 AI 生成菜谱

1. 登录后，在 Dashboard 中找到「AI 生成菜谱」功能入口。
2. 输入一些食材或描述，如「西红柿、鸡蛋、葱」。
3. 点击「生成」。
4. 如果返回了菜谱内容，说明 DeepSeek AI 接入正常。

### 13.4 测试邮箱验证码登录

1. 退出 Demo 登录或打开无痕窗口。
2. 访问 `https://你的域名.com/login`。
3. 选择「邮箱登录」。
4. 输入你的真实邮箱地址，点击「发送验证码」。
5. 检查邮箱是否收到 CookMate 的验证码邮件。
6. 输入验证码，能成功登录即说明邮箱服务配置正确。

---

## 十四、常见问题排查

### Q1：docker compose up -d --build 报错 `Cannot connect to the Docker daemon`

**原因**：Docker 服务没有启动。

**解决**：
```bash
systemctl start docker
systemctl enable docker
docker compose up -d --build
```

---

### Q2：容器 STATUS 一直是 `starting` 或 `unhealthy`

**原因**：应用启动失败或连接数据库失败。

**解决**：
```bash
# 查看详细日志
docker compose logs app
```

常见日志错误对应解决：
- 看到 `Can't reach database server`：检查 DATABASE_URL 是否填错
- 看到 `PrismaClientInitializationError`：检查 DATABASE_URL 格式是否正确
- 看到 `AUTH_SECRET is required`：检查 AUTH_SECRET 是否填写

---

### Q3：浏览器访问域名显示「无法访问此网站」

**排查步骤**：

1. **DNS 是否生效**：在本机执行 `nslookup 你的域名.com`，看是否能解析到服务器 IP。如果不能，说明 DNS 还没生效，再等一会儿。
2. **Nginx 是否运行**：`systemctl status nginx`
3. **防火墙是否开放**：
   ```bash
   # 阿里云/腾讯云需要在控制台的「安全组」或「防火墙」中开放 80 和 443 端口
   # 同时检查服务器本地防火墙
   ufw status
   # 如果 active，执行：
   ufw allow 80
   ufw allow 443
   ```

---

### Q4：登录时邮箱收不到验证码

**排查步骤**：

1. 检查 `.env.production` 中 EMAIL_HOST、EMAIL_PORT、EMAIL_USER、EMAIL_PASS 是否正确。
2. QQ 邮箱的话，确认填的是「授权码」而不是 QQ 密码。
3. 查看应用日志：`docker compose logs app | grep -i email`
4. 如果日志中看到 `535 错误`：说明授权码错误或 SMTP 未开启。

---

### Q5：AI 生成菜谱失败或返回为空

**排查步骤**：

1. 检查 DeepSeek 账户余额是否足够：登录 https://platform.deepseek.com 查看。
2. 检查 API Key 是否正确：`docker compose logs app | grep -i "api.key"`
3. 确认 `AI_BASE_URL` 是 `https://api.deepseek.com`，`AI_MODEL` 是 `deepseek-chat`。
4. 测试 API 连通性（在服务器上执行）：
   ```bash
   curl -X POST https://api.deepseek.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-你的APIKey" \
     -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"你好"}]}'
   ```

---

### Q6：Certbot 申请证书时提示 `Could not find a matching server block`

**原因**：Nginx 配置中 `server_name` 的域名与 SSL 申请域名不匹配。

**解决**：
1. 检查 `/etc/nginx/conf.d/cookmate.conf` 中的 `server_name` 是否正确。
2. 确保你的域名 DNS 已生效（用 `nslookup` 验证）。
3. 重新执行：`certbot --nginx -d 你的域名.com -d www.你的域名.com`

---

### Q7：数据库报 `remaining connection slots are reserved`

**原因**：Neon 免费版有连接数限制（通常 10~20 个并发连接）。

**解决**：
1. 在 `.env.production` 的 DATABASE_URL 末尾加上连接池参数：
   ```
   ?sslmode=require&connection_limit=5&pool_timeout=30
   ```
2. 重启容器：`docker compose down && docker compose up -d --build`

---

### Q8：`prisma migrate` 失败

**原因**：当前 schema.prisma 已经是正确版本，通常 Prisma 迁移会在容器启动时自动执行。如果失败，可能是因为 DATABASE_URL 指向的数据库不可达。

**解决**：
```bash
# 进入容器手动执行迁移
docker compose exec app npx prisma migrate deploy

# 如果报连接错误，先验证数据库是否可达
docker compose exec app npx prisma db push
```

---

## 附录A：更新部署

当你需要更新 CookMate 到新版本时：

```bash
cd /opt/cookmate
git pull origin main
docker compose down
docker compose up -d --build
```

约 2~3 分钟后新版本生效。

---

## 附录B：查看日志

```bash
# 查看最近 100 行日志
docker compose logs app --tail 100

# 实时跟踪日志（按 Ctrl+C 退出）
docker compose logs app -f
```

---

## 附录C：停止和重启

```bash
# 停止所有服务
docker compose down

# 重启所有服务
docker compose up -d

# 重启单个服务
docker compose restart app
```

---

## 附录D：数据备份

Neon 自动备份，无需手动操作。如果担心，可以在 Neon 控制台中启用「Point-in-time recovery」。

如需备份 Docker 数据卷（用户上传的文件等）：
```bash
# 服务器上的数据存储在 /opt/cookmate/data 目录
# 定期备份这个目录即可
tar -czf cookmate-data-backup-$(date +%Y%m%d).tar.gz /opt/cookmate/data/
```
