import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

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

export default function AlipayProvider<P extends AlipayProfile>(
  options: OAuthUserConfig<P>,
): OAuthConfig<P> {
  const apiBase = "https://openapi.alipay.com/gateway.do"

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
      async request(_ctx: { clientId: string; clientSecret?: string; params?: Record<string, string> }) {
        const params = _ctx.params
          const receivedParams = JSON.stringify(Object.keys(params || {}))

          const code = params?.code || params?.auth_code
          if (!code) {
            throw new Error("Missing auth_code - received: " + receivedParams)
          }

          // Mock：用于测试支付宝登录流程，返回固定 user_id 保证一致性
          return {
            tokens: {
              access_token: "mock_token_" + code,
              user_id: "alipay_test_user",
              expires_at: Date.now() + 3600000,
            },
          }
      },
    },

    userinfo: {
      url: apiBase,
      async request(_ctx: { clientId: string; tokens: { access_token?: string; openid?: string } }) {
          // Mock：返回固定用户信息
          return {
            userId: "alipay_test_user",
            nickName: "支付宝测试用户",
            avatar: "",
            province: "",
            city: "",
            gender: "",
            isCertified: "T",
            isStudentCertified: "F",
            userType: "2",
            userStatus: "",
          } as unknown as P
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
