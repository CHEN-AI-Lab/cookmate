import { redirect } from "next/navigation"
import { defaultLocale } from "@cookmate/shared/constants"

export default function RootPage() {
  redirect(`/${defaultLocale}`)
}