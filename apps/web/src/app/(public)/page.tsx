import { auth } from "@/lib/auth"
import Link from "next/link"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { getTranslations } from "next-intl/server"

export default async function HomePage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const thero = await getTranslations("hero")
  const thow = await getTranslations("howItWorks")
  const tfeatures = await getTranslations("features")
  const tstats = await getTranslations("stats")
  const ttestimonials = await getTranslations("testimonials")
  const tcta = await getTranslations("ctaBanner")

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2D3436] leading-tight">
          {thero("title")}
          <br />
          <span className="text-[#FF6B35]">{thero("titleHighlight")}</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          {thero("subtitle")}
          <br />
          {thero("subtitle2")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            {thero("cta")}
          </Link>
          <a
            href="#how"
            className="text-gray-600 px-8 py-3 rounded-full text-lg border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
          >
            {thero("howItWorks")}
          </a>
        </div>

        {/* Demo card */}
        <div className="mt-12 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-2">{thero("tryIt")}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {thero.raw("demoIngredients").map((item: string) => (
                <span
                  key={item}
                  className="bg-orange-50 text-[#FF6B35] px-3 py-1 rounded-full text-sm border border-orange-200"
                >
                  {item}
                </span>
              ))}
            </div>
            <Link
              href={session ? "/app/recipes" : "/register"}
              className="inline-block bg-[#FF6B35] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              🍳 {thero("demoRecipe")}
            </Link>
          </div>
          {/* Result preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left">
            <p className="text-sm font-medium text-[#2D3436]">{thero("demoRecipe")}</p>
            <p className="text-lg font-bold mt-1">{thero("demoRecipeName")}</p>
            <p className="text-sm text-gray-500 mt-1">{thero("demoRecipeMeta")}</p>
            <p className="text-sm text-gray-600 mt-2">
              {thero("demoRecipeDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">{thow("title")}</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "🥦", titleKey: "step1Title", descKey: "step1Desc" },
              { emoji: "🤖", titleKey: "step2Title", descKey: "step2Desc" },
              { emoji: "📋", titleKey: "step3Title", descKey: "step3Desc" },
            ].map((step) => (
              <div key={step.titleKey} className="text-center p-6">
                <span className="text-5xl">{step.emoji}</span>
                <h3 className="mt-4 text-xl font-bold text-[#2D3436]">{thow(step.titleKey)}</h3>
                <p className="mt-2 text-gray-500">{thow(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#FFF8F0]">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">{tfeatures("title")}</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {["aiRecipe", "mealPlan", "grocery", "diet", "pantry", "recipes"].map((key) => {
              const feature = tfeatures.raw(key) as { emoji: string; title: string; desc: string }
              return (
                <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50">
                  <span className="text-3xl">{feature.emoji}</span>
                  <h3 className="mt-3 font-bold text-[#2D3436]">{feature.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "stats.users", label: "stats.usersLabel" },
              { value: "stats.recipes", label: "stats.recipesLabel" },
              { value: "stats.meals", label: "stats.mealsLabel" },
              { value: "stats.satisfaction", label: "stats.satisfactionLabel" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-bold text-[#FF6B35]">
                  {tstats(s.value)}
                </p>
                <p className="mt-1 text-sm text-gray-500">{tstats(s.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#FFF8F0]">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">{ttestimonials("title")}</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-lg font-bold text-[#FF6B35]">
                    {ttestimonials(`item${i}Name`).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3436] text-sm">{ttestimonials(`item${i}Name`)}</p>
                    <p className="text-xs text-gray-400">{ttestimonials(`item${i}Role`)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  &ldquo;{ttestimonials(`item${i}Content`)}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-[#2D3436]">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-white">{tcta("title")}</h2>
          <p className="mt-3 text-gray-400 text-lg">{tcta("subtitle")}</p>
          <Link
            href={ctaHref}
            className="mt-8 inline-block bg-[#FF6B35] text-white px-10 py-3.5 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-800/30"
          >
            {tcta("button")}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}