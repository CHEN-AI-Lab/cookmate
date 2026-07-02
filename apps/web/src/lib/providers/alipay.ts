import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"
import crypto from "node:crypto"

export interface AlipayProfile {
  code: string
  msg: string
  userId: string
  avatar: string
  nickName: string
  province: string
  city: string
  gender: string
  isCertified: string
  isStudentCertified: string
  userType: string
  userStatus: string
}

interface AlipayUserInfoResponse {
  alipay_user_info_share_response: AlipayProfile
  sign: string
}

interface AlipayTokenResponse {
  alipay_system_oauth_token_response?: {
    access_token: string
    user_id: string
    alipay_user_id: string
    expires_in: number
    refresh_token: string
    re_expires_in: number
  }
  error_response?: { code: string; msg: string; sub_code?: string; sub_msg?: string }
  sign: string
}

function signParams(params: Record<string, string>, privateKey: string): string {
  const sorted = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(sorted, "utf8")
  return signer.sign(privateKey, "base64")
}

export default function AlipayProvider<P extends AlipayProfile>(
  options: OAuthUserConfig<P> & { alipayPublicKey?: string },
): OAuthConfig<P> {
  const alipayPublicKey = options.alipayPublicKey || ""
  const apiBase = "https://openapi.alipay.com/gateway.do"
  const fixedSecret = (options.clientSecret || "").replace(/\\n/g, "\n")

  return {
    id: "alipay",
    name: "Alipay",
    type: "oauth",
    style: { logo: "/alipay.svg", bg: "#1677FF", text: "#fff" },
    checks: [],

    authorization: {
      url: "https://openauth.alipay.com/oauth2/publicAppAuthorize.htm",
      params: {
        app_id: options.clientId,
        scope: "auth_user",
      },
    },

    token: {
      url: apiBase,
      params: { grant_type: "authorization_code" },
      async request(ctx: any) {
        const { clientId, params } = ctx
        const code = params.code || params.auth_code
        if (!code) throw new Error("Missing auth_code")

        const ts = (() => { const d = new Date(); d.setHours(d.getHours() + 8); return d.toISOString().replace("T", " ").replace(/\..+/, ""); })()
        const p: Record<string, string> = {
          app_id: clientId,
          method: "alipay.system.oauth.token",
          format: "JSON", charset: "utf-8", sign_type: "RSA2",
          timestamp: ts, version: "1.0",
          grant_type: "authorization_code",
          code,
        }
        p.sign = signParams(p, fixedSecret)
        const body = new URLSearchParams(p)
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: body.toString(),
        })
        const text = await res.text()
        const data: AlipayTokenResponse = JSON.parse(text)
        if (!data.alipay_system_oauth_token_response?.access_token) {
          const e = (data as any).error_response
          throw new Error("Alipay token error: " + (e?.sub_msg || e?.msg || text))
        }
        return {
          tokens: {
            access_token: data.alipay_system_oauth_token_response.access_token,
            user_id: data.alipay_system_oauth_token_response.user_id,
            expires_at: Date.now() + data.alipay_system_oauth_token_response.expires_in * 1000,
          },
        }
      },
    },

    userinfo: {
      url: apiBase,
      async request(ctx: any) {
        const ts = (() => { const d = new Date(); d.setHours(d.getHours() + 8); return d.toISOString().replace("T", " ").replace(/\..+/, ""); })()
        const p: Record<string, string> = {
          app_id: ctx.provider.clientId,
          method: "alipay.user.info.share",
          format: "JSON", charset: "utf-8", sign_type: "RSA2",
          timestamp: ts, version: "1.0",
          auth_token: ctx.tokens.access_token,
        }
        p.sign = signParams(p, fixedSecret)
        const body = new URLSearchParams(p)
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: body.toString(),
        })
        const text = await res.text()
        const data: AlipayUserInfoResponse = JSON.parse(text)
        if (!data.alipay_user_info_share_response?.userId) {
          throw new Error("Alipay userinfo error: " + text)
        }
        if (alipayPublicKey && data.sign) {
          const sorted = Object.keys(data.alipay_user_info_share_response).sort()
            .map((k) => k + "=" + String((data.alipay_user_info_share_response as any)[k])).join("&")
          const verifier = crypto.createVerify("RSA-SHA256")
          verifier.update(sorted, "utf8")
          if (!verifier.verify(alipayPublicKey, data.sign, "base64")) {
            console.warn("Alipay response signature verification failed")
          }
        }
        return data.alipay_user_info_share_response as unknown as P
      },
    },

    profile(profile) {
      return {
        id: profile.userId,
        name: profile.nickName,
        image: profile.avatar,
      }
    },

    options,
  }
}
