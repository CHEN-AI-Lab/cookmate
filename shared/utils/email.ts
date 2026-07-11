// ─── 统一邮件发送模块 ───
// 支持多个服务商，按顺序尝试，一个失败自动切到下一个
// 配置环境变量即可启用对应服务商，不配置就跳过

interface EmailProvider {
  name: string
  send(to: string, subject: string, html: string): Promise<{ ok: boolean; quotaExceeded: boolean }>
}

// ─── Resend ───
const resendProvider: EmailProvider = {
  name: "Resend",
  async send(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return { ok: false, quotaExceeded: false }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "CookMate <noreply@aaigc.online>", to, subject, html }),
      })
      if (res.ok) return { ok: true, quotaExceeded: false }
      const body = await res.json().catch(() => ({}))
      const isQuota = body?.name === "daily_quota_exceeded" || body?.name === "monthly_quota_exceeded"
      return { ok: false, quotaExceeded: isQuota }
    } catch { return { ok: false, quotaExceeded: false } }
  },
}

// ─── SendGrid ───
const sendgridProvider: EmailProvider = {
  name: "SendGrid",
  async send(to, subject, html) {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) return { ok: false, quotaExceeded: false }
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: "noreply@aaigc.online" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      })
      if (res.ok) return { ok: true, quotaExceeded: false }
      // SendGrid 返回 429 表示额度/限流
      return { ok: false, quotaExceeded: res.status === 429 }
    } catch { return { ok: false, quotaExceeded: false } }
  },
}

// ─── Mailgun ───
const mailgunProvider: EmailProvider = {
  name: "Mailgun",
  async send(to, subject, html) {
    const apiKey = process.env.MAILGUN_API_KEY
    const domain = process.env.MAILGUN_DOMAIN
    if (!apiKey || !domain) return { ok: false, quotaExceeded: false }
    try {
      const formData = new URLSearchParams()
      formData.append("from", `CookMate <noreply@aaigc.online>`)
      formData.append("to", to)
      formData.append("subject", subject)
      formData.append("html", html)
      const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: { "Authorization": `Basic ${btoa(`api:${apiKey}`)}` },
        body: formData,
      })
      if (res.ok) return { ok: true, quotaExceeded: false }
      return { ok: false, quotaExceeded: res.status === 429 }
    } catch { return { ok: false, quotaExceeded: false } }
  },
}

// ─── 所有已配置的服务商列表 ───
const providers: EmailProvider[] = [
  resendProvider,
  sendgridProvider,
  mailgunProvider,
].filter((p) => {
  // 只保留配置了对应环境变量的服务商
  const key = {
    Resend: "RESEND_API_KEY",
    SendGrid: "SENDGRID_API_KEY",
    Mailgun: "MAILGUN_API_KEY",
  }[p.name]
  return key ? !!process.env[key] : false
})

export interface SendEmailResult {
  ok: boolean
  quotaExceeded: boolean
  provider: string | null
}

/**
 * 发送邮件，按配置顺序尝试每个服务商
 * 一个成功就返回，全部失败则返回最后一个失败结果
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  if (providers.length === 0) {
    console.warn("[email] No email providers configured")
    return { ok: false, quotaExceeded: false, provider: null }
  }

  for (const provider of providers) {
    try {
      const result = await provider.send(to, subject, html)
      if (result.ok) {
        console.log(`[email] Sent via ${provider.name}`)
        return { ok: true, quotaExceeded: false, provider: provider.name }
      }
      if (result.quotaExceeded) {
        console.warn(`[email] ${provider.name} quota exceeded, trying next...`)
        continue
      }
      console.warn(`[email] ${provider.name} failed, trying next...`)
    } catch (err) {
      console.error(`[email] ${provider.name} error:`, err)
    }
  }

  const last = providers[providers.length - 1]
  console.error(`[email] All providers failed`)
  return { ok: false, quotaExceeded: false, provider: last?.name || null }
}