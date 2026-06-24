// TODO: Phase 2 - 营养追踪 API
// 功能：获取/记录/统计营养数据
// 状态：后期实现

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({
    error: "此功能规划中，后期实现",
    code: "FEATURE_NOT_IMPLEMENTED",
  }, { status: 501 })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: "此功能规划中，后期实现",
    code: "FEATURE_NOT_IMPLEMENTED",
  }, { status: 501 })
}
