import { setRequestLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function AuthErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { error } = await searchParams
  const t = await getTranslations({ locale, namespace: 'auth' })

  // OAuthAccountNotLinked = 尝试关联/登录的社交邮箱已被另一个账号绑定
  const emailTaken = error === 'OAuthAccountNotLinked'

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-error/10 flex items-center justify-center text-2xl mb-4">
          ⚠️
        </div>
        <h1 className="text-lg font-semibold text-text-primary mb-2">{t('linkErrorTitle')}</h1>
        <p className="text-sm text-text-secondary mb-1">
          {emailTaken ? t('linkEmailTaken') : t('linkOtherError')}
        </p>
        {emailTaken && (
          <p className="text-xs text-text-secondary/60 mb-6">{t('linkEmailTakenDesc')}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={`/${locale}/app/settings`}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t('backToAccount')}
          </Link>
          <Link
            href={`/${locale}`}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-accent/5 transition-colors"
          >
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
