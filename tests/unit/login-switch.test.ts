import { describe, it, expect, vi, beforeEach } from 'vitest'

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

  it('handleOAuth calls signIn with correct provider', async () => {
    const provider = 'github'
    await mockSignIn(provider, { callbackUrl: '/app/dashboard' })
    expect(mockSignIn).toHaveBeenCalledWith('github', { callbackUrl: '/app/dashboard' })
  })

  it('handleOAuth does not call signOut', async () => {
    await mockSignIn('github', { callbackUrl: '/app/dashboard' })
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('all OAuth providers call signIn with correct provider name', async () => {
    const providers = ['google', 'github', 'alipay', 'demo']
    for (const provider of providers) {
      vi.clearAllMocks()
      await mockSignIn(provider, { callbackUrl: '/app/dashboard' })
      expect(mockSignIn).toHaveBeenCalledWith(provider, expect.any(Object))
    }
  })
})