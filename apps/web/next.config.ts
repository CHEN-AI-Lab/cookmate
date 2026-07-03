import type { NextConfig } from "next"
import { resolve } from "path"

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: resolve("../.."),
}

export default nextConfig
