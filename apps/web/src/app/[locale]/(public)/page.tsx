import { auth } from "@/lib/auth"
import Link from "next/link"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import DemoLoginButton from "@/components/ui/DemoLoginButton"
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
    <div className="min-h-screen bg-bg-brand">
      <PublicNavbar />

      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary leading-tight">
          {thero("title")}
          <br />
          <span className="text-accent">{thero("titleHighlight")}</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
          {thero("subtitle")}
          <br />
          {thero("subtitle2")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="bg-accent text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            {thero("cta")}
          </Link>
          <DemoLoginButton
            className="bg-card text-accent px-8 py-3 rounded-full text-lg font-medium border-2 border-accent hover:bg-surface transition-colors cursor-pointer"
          >
            🚀 {thero("tryDemo")}
          </DemoLoginButton>
          <a
            href="#how"
            className='text-text-secondary px-8 py-3 rounded-full text-lg border border-border hover:border-accent hover:text-accent transition-colors'
          >
            {thero("howItWorks")}
          </a>
        </div>

        {/* Demo card */}
        <div className="mt-12 max-w-2xl mx-auto bg-card rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-left">
            <p className="text-sm text-text-secondary mb-2">{thero("tryIt")}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {thero.raw("demoIngredients").map((item: string) => (
                <span
                  key={item}
                  className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm border-accent/20"
                >
                  {item}
                </span>
              ))}
            </div>
            <Link
              href={session ? "/app/recipes" : "/register"}
              className="inline-block bg-accent text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              🍳 {thero("demoRecipe")}
            </Link>
          </div>
          {/* Result preview */}
          <div className='mt-6 p-4 bg-surface rounded-xl text-left'>
            <p className="text-sm font-medium text-text-primary">{thero("demoRecipe")}</p>
            <p className="text-lg font-bold mt-1">{thero("demoRecipeName")}</p>
            <p className="text-sm text-text-secondary mt-1">{thero("demoRecipeMeta")}</p>
            <p className="text-sm text-text-secondary mt-2">
              {thero("demoRecipeDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 bg-card">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-text-primary">{thow("title")}</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "🥦", titleKey: "step1Title", descKey: "step1Desc" },
              { emoji: "🤖", titleKey: "step2Title", descKey: "step2Desc" },
              { emoji: "📋", titleKey: "step3Title", descKey: "step3Desc" },
            ].map((step) => (
              <div key={step.titleKey} className="text-center p-6">
                <span className="text-5xl">{step.emoji}</span>
                <h3 className="mt-4 text-xl font-bold text-text-primary">{thow(step.titleKey)}</h3>
                <p className="mt-2 text-text-secondary">{thow(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-bg-brand">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-text-primary">{tfeatures("title")}</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {["aiRecipe", "mealPlan", "grocery", "diet", "pantry", "recipes"].map((key) => {
              const feature = tfeatures.raw(key) as { emoji: string; title: string; desc: string }
              return (
                <div key={key} className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                  <span className="text-3xl">{feature.emoji}</span>
                  <h3 className="mt-3 font-bold text-text-primary">{feature.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-card">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "users", label: "usersLabel" },
              { value: "recipes", label: "recipesLabel" },
              { value: "meals", label: "mealsLabel" },
              { value: "satisfaction", label: "satisfactionLabel" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-bold text-accent">
                  {tstats(s.value)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{tstats(s.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-bg-brand">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-text-primary">{ttestimonials("title")}</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                    {ttestimonials(`item${i}Name`).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{ttestimonials(`item${i}Name`)}</p>
                    <p className='text-xs text-text-secondary'>{ttestimonials(`item${i}Role`)}</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  &ldquo;{ttestimonials(`item${i}Content`)}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-bg-inverse">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-white">{tcta("title")}</h2>
          <p className='mt-3 text-text-secondary text-lg'>{tcta("subtitle")}</p>
          <Link
            href={ctaHref}
            className="mt-8 inline-block bg-accent text-white px-10 py-3.5 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-800/30"
          >
            {tcta("button")}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}