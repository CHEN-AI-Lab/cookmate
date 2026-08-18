# CookMate Progress

## 当前状态: 活跃开发中

### ✅ 已完成

#### 基础设施
- [x] 项目骨架 (Next.js 16, TypeScript strict, Tailwind CSS 4, pnpm monorepo)
- [x] shared/ 跨平台共享层 (types, constants, utils, validators, hooks, api, messages, i18n)
- [x] 完整质量门禁体系 (check.sh / CI / pre-commit / 结构检查 / 迁移安全)
- [x] 82+ 单元测试，覆盖 shared 层 + 业务逻辑
- [x] 国际化支持：zh-CN, en, zh-TW, ja 四种语言
- [x] 中英文双语 UI，一键切换

#### 用户系统
- [x] NextAuth.js v5 认证框架
- [x] 邮箱/密码注册登录
- [x] 手机号/密码注册登录（含短信验证码）
- [x] Google OAuth 登录
- [x] 支付宝 OAuth 登录
- [x] 邮箱 Magic Link 登录
- [x] 密码重置/忘记密码流程
- [x] 用户引导（Onboarding Wizard）
- [x] 用户账户设置（绑定邮箱、删除账号、导出数据）

#### 核心功能
- [x] AI 食谱生成（OpenAI 兼容接口）
- [x] 食谱浏览（列表、详情、收藏/取消收藏）
- [x] 每周膳食规划器（Meal Planner）
- [x] 购物清单自动生成（从膳食规划）
- [x] 食材管理（Pantry CRUD）
- [x] 仪表盘 + 营养图表
- [x] 移动端优先响应式设计

#### 支付系统
- [x] Stripe 支付集成（创建结账、Webhook、订阅管理）
- [x] Creem 支付集成（创建结账、Webhook）
- [x] 支付宝支付集成（创建订单、异步通知）
- [x] 订阅管理（取消订阅）
- [x] 订单记录查询

#### DevOps
- [x] 全量质量检查脚本 (check.sh: 结构/迁移/lint/翻译/tsc/测试)
- [x] CI 流水线 (GitHub Actions: 结构检查 + 迁移安全 + lint + 测试 + 构建)
- [x] pre-commit 钩子（结构检查 + 测试 + 翻译记忆）
- [x] 环境变量模板 (.env.example)
- [x] 分支规范：preview 开发 → main 生产

### 🚧 进行中
- [ ] 社区食谱分享
- [ ] 营养追踪增强

### 📋 计划中
- [ ] 图片识别（扫描食材）
- [ ] 膳食规划优化（营养均衡）
- [ ] 基于历史记录的食谱推荐
- [ ] 购物清单对接配送
- [ ] 食谱缩放 & 单位转换
- [ ] iOS/Android 移动端（未来）

## 已知问题
- 支付宝支付待商户注册（PayJS 集成）
- 营养计算为估算值
- pre-commit 测试门禁需修复 pipefail 问题（见 .husky/pre-commit:18）