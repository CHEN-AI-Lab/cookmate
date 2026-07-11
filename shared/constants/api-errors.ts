// ─── API 错误消息中英文对照表 ───
// 所有 API 路由统一从此引用，不要硬编码中文/英文错误消息

export const API_ERRORS = {
  // ── Auth ──
  loginRequired:             { zh: "请先登录",                    en: "Please log in first" },
  userNotFound:              { zh: "用户不存在",                  en: "User not found" },
  requestFailed:             { zh: "请求失败，请稍后重试",       en: "Request failed, please try again later" },
  saveFailed:                { zh: "保存失败",                    en: "Failed to save" },
  updateFailed:              { zh: "更新失败",                    en: "Failed to update" },

  // ── Demo ──
  demoNoPassword:            { zh: "体验用户不支持设置密码，请注册后使用",  en: "Demo users cannot set passwords. Please sign up." },
  demoNoPayment:             { zh: "体验用户不支持付费，请注册后使用",    en: "Demo users cannot make payments. Please sign up." },
  demoNoBind:                { zh: "体验用户不支持绑定邮箱，请注册后使用", en: "Demo users cannot bind email. Please sign up." },
  demoNoProfile:             { zh: "体验用户不支持修改资料，请注册后使用", en: "Demo users cannot modify profiles. Please sign up." },

  // ── Payment ──
  paymentNotConfigured:      { zh: "支付系统正在配置中，上线后即可使用", en: "Payment system is being configured. Available after launch." },
  alipayNotConfigured:       { zh: "支付宝支付正在配置中",              en: "Alipay is being configured" },
  invalidPlan:               { zh: "无效的订阅计划",                     en: "Invalid subscription plan" },
  noSubscription:            { zh: "您还没有创建订阅，请先订阅",          en: "You haven't created a subscription yet." },
  createPaymentFailed:       { zh: "创建支付失败",                       en: "Failed to create payment" },
  createPortalFailed:        { zh: "创建管理页面失败",                   en: "Failed to create management page" },

  // ── Email ──
  emailSendFailed:           { zh: "邮件发送失败，请检查配置",            en: "Failed to send email, please check configuration" },
  emailSendError:            { zh: "发送失败",                           en: "Failed to send" },

  // ── Pantry ──
  addItemFailed:             { zh: "添加失败，请稍后重试",               en: "Failed to add, please try again" },
  pantryNetworkError:        { zh: "网络错误，请稍后重试",               en: "Network error, please try again" },
  itemNotFound:              { zh: "食材不存在",                         en: "Ingredient not found" },
  itemNameRequired:          { zh: "请输入食材名称",                     en: "Please enter an ingredient name" },

  // ── Recipe generation ──
  needIngredients:           { zh: "请至少提供一种食材",                  en: "Please provide at least one ingredient" },
  generateFailed:            { zh: "生成失败，请稍后重试",               en: "Generation failed, please try again later" },

  // ── Grocery list ──
  addManualFailed:           { zh: "添加失败",                           en: "Failed to add" },
  purchaseFailed:            { zh: "操作失败",                           en: "Operation failed" },

  // ── Meal plan ──
  addToPlanFailed:           { zh: "添加失败",                           en: "Failed to add" },
  deleteSlotFail:            { zh: "删除失败",                           en: "Failed to delete" },
  mealPlanGenerateFailed:    { zh: "生成失败",                           en: "Failed to generate" },

  // ── Webhook ──
  creemWebhookError:         { zh: "Webhook 处理失败",                   en: "Webhook processing failed" },
  stripeWebhookError:        { zh: "Stripe Webhook 处理失败",            en: "Stripe webhook processing failed" },

  // ── Stripe ──
  stripeNotConfigured:       { zh: "Stripe 尚未配置",                    en: "Stripe is not configured" },

  // ── Alipay ──
  invalidAlipayNotify:       { zh: "无效的支付宝通知",                   en: "Invalid Alipay notification" },
  alipayOrderNotFound:       { zh: "订单不存在",                         en: "Order not found" },

  // ── Creem ──
  creemCheckoutFailed:       { zh: "查询 Creem 订单失败",               en: "Failed to query Creem order" },
  noPendingCreemOrder:       { zh: "没有待处理的 Creem 订单",            en: "No pending Creem orders" },

  // ── General ──
  notFound:                  { zh: "未找到",                             en: "Not found" },
  invalidInput:              { zh: "无效的输入",                         en: "Invalid input" },
  operationFailed:           { zh: "操作失败",                           en: "Operation failed" },
} as const

type ErrorKey = keyof typeof API_ERRORS

export function apiError(key: ErrorKey, locale: string): string {
  const msg = API_ERRORS[key]
  if (!msg) return key
  return locale === "en" || locale.startsWith("en") ? msg.en : msg.zh
}