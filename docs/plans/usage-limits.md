# 免费版用量限制实施计划

## 目标
为免费版用户增加用量限制，引导升级 Pro。所有限制值集中在 `shared/constants/usage-limits.ts`。

## 限制方案

| 功能 | 免费版上限 | Pro | 备注 |
|------|-----------|-----|------|
| 收藏菜谱 | ≤ 10 | 无限 | UI 已宣传，后端补校验 |
| 总菜谱数 | ≤ 25 | 无限 | saveOnly / AI 生成均检查 |
| 食材库 | ≤ 15 种 | 无限 | 防囤货 |
| 周计划 | ≤ 3天 | 7天 | 按天限制，不按槽 |
| AI生成 | 每日1次 | 无限 | 已有 |

## 修改文件清单

### 1. shared/constants/usage-limits.ts（新建）
- 定义所有限制常量

### 2. apps/web/src/app/api/recipes/star/route.ts
- 收藏时：FREE 用户已收藏 ≥10 时阻止新增（允许取消收藏）

### 3. apps/web/src/app/api/recipes/generate/route.ts
- saveOnly 模式：创建前检查总数 < 25
- AI 生成模式：循环创建前检查总数 < 25

### 4. apps/web/src/app/api/meal-plan/add/route.ts
- 添加槽位前：检查本周已占用天数 < 3

### 5. apps/web/src/app/api/pantry/route.ts
- 单个/批量添加前：检查当前数量 < 15

### 6. 翻译文件（shared/messages/*.json）
- 新增限制超出提示文案（zh-CN / en / zh-TW / ja）

### 7. 测试（tests/unit/usage-limits.test.ts）
- 覆盖 4 个限制的 Happy Path + 超限 + 边界值

## 错误提示文案
- 收藏超限："收藏已达上限，升级 Pro 可无限收藏"
- 菜谱超限："菜谱已达上限（25个），升级 Pro 可无限保存"
- 周计划超限："免费版每周最多规划 3 天，升级 Pro 解锁整周计划"
- 食材库超限："食材库已达上限（15种），升级 Pro 无限添加"
