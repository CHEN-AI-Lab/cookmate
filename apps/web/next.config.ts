import type { NextConfig } from "next"
import { resolve } from "path"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: resolve("../.."),
}

export default withNextIntl(nextConfig)