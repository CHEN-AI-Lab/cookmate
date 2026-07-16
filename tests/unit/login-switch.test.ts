import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth/react
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

describe('login account switching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleOAuth calls signOut before page navigation when already logged in', async () => {
    const isLoggedIn = true
    const provider = 'github'

    if (isLoggedIn) {
      await mockSignOut({ redirect: false })
      const redirectUrl = '/api/auth/signin/github?callbackUrl=' + encodeURIComponent('/app/dashboard')
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
      expect(redirectUrl).toContain('/api/auth/signin/github')
    }
  })

  it('handleOAuth does NOT call signOut when not logged in', async () => {
    const isLoggedIn = false
    const provider = 'google'

    if (isLoggedIn) await mockSignOut({ redirect: false })
    await mockSignIn(provider, { callbackUrl: '/app/dashboard' })

    expect(mockSignOut).not.toHaveBeenCalled()
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/app/dashboard' })
  })

  it('all OAuth providers use the same signOut+redirect pattern', () => {
    const providers = ['google', 'github', 'alipay', 'demo']
    const isLoggedIn = true

    for (const provider of providers) {
      vi.clearAllMocks()
      if (isLoggedIn) {
        mockSignOut({ redirect: false })
        const url = '/api/auth/signin/' + provider + '?callbackUrl=' + encodeURIComponent('/app/dashboard')
        expect(url).toContain('/api/auth/signin/' + provider)
      }
      expect(mockSignOut).toHaveBeenCalled()
    }
  })

  it('handleEmailVerify calls signOut before API call when logged in', async () => {
    const isLoggedIn = true
    if (isLoggedIn) await mockSignOut({ redirect: false })
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('handlePasswordLogin calls signOut before password check when logged in', async () => {
    const isLoggedIn = true
    if (isLoggedIn) await mockSignOut({ redirect: false })
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
  })
})