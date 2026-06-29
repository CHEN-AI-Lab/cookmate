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
  alipay_system_oauth_token_response: {
    access_token: string
    user_id: string
    alipay_user_id: string
    expires_in: number
    refresh_token: string
    re_expires_in: number
  }
  sign: string
}

function signParams(params: Record<string, string>, privateKey: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => k + "=" + params[k])
    .join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(sorted, "utf8")
  return signer.sign(privateKey, "base64")
}

function buildSignedParams(
  apiName: string,
  bizContent: Record<string, unknown>,
  appId: string,
  privateKey: string,
): URLSearchParams {
  const commonParams: Record<string, string> = {
    app_id: appId,
    method: apiName,
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: (() => { const d = new Date(); d.setHours(d.getHours() + 8); return d.toISOString().replace('T', ' ').replace(/\..+/, ''); })(),
    version: "1.0",
    biz_content: JSON.stringify(bizContent),
  }
  commonParams.sign = signParams(commonParams, privateKey)
  return new URLSearchParams(commonParams)
}

export default function AlipayProvider<P extends AlipayProfile>(
  options: OAuthUserConfig<P> & { alipayPublicKey?: string },
): OAuthConfig<P> {
  const alipayPublicKey = options.alipayPublicKey || ""
  const apiBase = "https://openapi.alipay.com/gateway.do"

  return {
    id: "alipay",
    name: "Alipay",
    type: "oauth",
    style: { logo: "/alipay.svg", bg: "#1677FF", text: "#fff" },
    checks: [], // Alipay doesn't return state/PKCE params

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
        const { clientId, clientSecret, params } = ctx
        const code = params.code || params.auth_code
        if (!code) throw new Error("Missing auth_code")

        const body = buildSignedParams(
          "alipay.system.oauth.token",
          { grant_type: "authorization_code", code },
          clientId,
          clientSecret,
        )

        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: body.toString(),
        })

        const text = await res.text()
        const data: AlipayTokenResponse = JSON.parse(text)

        if (!data.alipay_system_oauth_token_response?.access_token) {
          throw new Error("Alipay token error: " + text)
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
        const body = buildSignedParams(
          "alipay.user.info.share",
          { auth_token: ctx.tokens.access_token },
          ctx.provider.clientId,
          ctx.provider.clientSecret,
        )

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
          const sorted = Object.keys(data.alipay_user_info_share_response)
            .sort()
            .map((k) => k + "=" + String((data.alipay_user_info_share_response as any)[k]))
            .join("&")
          const verifier = crypto.createVerify("RSA-SHA256")
          verifier.update(sorted, "utf8")
          const valid = verifier.verify(alipayPublicKey, data.sign, "base64")
          if (!valid) {
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