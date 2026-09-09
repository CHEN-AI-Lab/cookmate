import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "./routing"
import zhCN from "@cookmate/shared/messages/zh-CN.json"
import zhTW from "@cookmate/shared/messages/zh-TW.json"
import ja from "@cookmate/shared/messages/ja.json"
import en from "@cookmate/shared/messages/en.json"

const messageMap: Record<string, Record<string, unknown>> = {
  "zh-CN": zhCN as Record<string, unknown>,
  "zh-TW": zhTW as Record<string, unknown>,
  "ja": ja as Record<string, unknown>,
  "en": en as Record<string, unknown>,
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: messageMap[locale] ?? messageMap.en,
  }
})