import { redirect } from "next/navigation"
import { defaultLocale } from "@cookmate/shared/messages"

export default function RootPage() {
  redirect(`/${defaultLocale}`)
}