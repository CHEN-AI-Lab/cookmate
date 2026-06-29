import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface WeChatProfile {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid: string
}

export default function WeChatProvider<P extends WeChatProfile>(
  options: OAuthUserConfig<P>,
): OAuthConfig<P> {
  return {
    id: "wechat",
    name: "微信",
    type: "oauth",
    style: { logo: "/wechat.svg", bg: "#07C160", text: "#fff" },
    checks: [],

    authorization: {
      url: "https://open.weixin.qq.com/connect/qrconnect",
      params: {
        appid: options.clientId,
        scope: "snsapi_login",
        response_type: "code",
      },
    },

    token: {
      url: "https://api.weixin.qq.com/sns/oauth2/access_token",
      params: { grant_type: "authorization_code" },
      async request(ctx: any) {
        const { clientId, clientSecret, params } = ctx
        const code = params.code
        if (!code) throw new Error("Missing authorization code")

        const tokenUrl =
          "https://api.weixin.qq.com/sns/oauth2/access_token" +
          "?appid=" + clientId +
          "&secret=" + clientSecret +
          "&code=" + code +
          "&grant_type=authorization_code"

        const res = await fetch(tokenUrl)
        const data = await res.json()

        if (data.errcode) {
          throw new Error("WeChat token error: " + data.errmsg + " (" + data.errcode + ")")
        }

        return {
          tokens: {
            access_token: data.access_token,
            openid: data.openid,
            unionid: data.unionid,
            expires_at: Date.now() + data.expires_in * 1000,
          },
        }
      },
    },

    userinfo: {
      url: "https://api.weixin.qq.com/sns/userinfo",
      async request(ctx: any) {
        const userinfoUrl =
          "https://api.weixin.qq.com/sns/userinfo" +
          "?access_token=" + ctx.tokens.access_token +
          "&openid=" + ctx.tokens.openid

        const res = await fetch(userinfoUrl)
        const data = await res.json()

        if (data.errcode) {
          throw new Error("WeChat userinfo error: " + data.errmsg + " (" + data.errcode + ")")
        }

        return data
      },
    },

    profile(profile) {
      return {
        id: profile.openid,
        name: profile.nickname,
        image: profile.headimgurl,
      }
    },

    options,
  }
}
