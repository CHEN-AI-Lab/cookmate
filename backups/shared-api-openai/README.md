# Backup: shared/api/openai.ts

**备份日期:** 2026-07-20

**备份原因:** 生成周计划 / AI 菜谱的功能经过修复后正常工作。备份此文件以防后续修改出问题时可回退。

**当前状态:** 验证通过
- 周计划生成: ✅ 正常工作
- AI 菜谱生成: ✅ 正常工作
- 修复内容: `callAI` 调用加了 try-catch，超时/失败时降级到 mock 数据
- Sensenova API Key: 有效
- Vercel Hobby 10s 超时限制已处理

**恢复方法:** 将此文件覆盖回 `shared/api/openai.ts` 即可。