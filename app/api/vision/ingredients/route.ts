// TODO: Phase 3 - 拍照识别食材 API
// 功能：使用 GPT-4o Vision 识别上传的食材照片，返回食材列表
// 状态：后期实现
// 计划：
//   - 前端：在食材库页面添加"拍照添加"按钮
//   - API: /api/vision/ingredients (上传图片 → 返回识别结果)
//   - 依赖：OpenAI GPT-4o Vision 或兼容接口

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: "此功能规划中，后期实现",
    code: "FEATURE_NOT_IMPLEMENTED",
  }, { status: 501 })
}
