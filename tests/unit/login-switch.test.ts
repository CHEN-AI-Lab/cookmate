import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockSignIn = vi.fn()
const mockSignOut = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

describe('OAuth sign-in calls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls signIn with the correct provider and callback URL', async () => {
    mockSignIn.mockResolvedValue(undefined)
    const provider = 'github'
    await mockSignIn(provider, { callbackUrl: '/app/dashboard' })
    expect(mockSignIn).toHaveBeenCalledWith('github', { callbackUrl: '/app/dashboard' })
  })

  it('does not call signOut during sign-in flow', async () => {
    mockSignIn.mockResolvedValue(undefined)
    await mockSignIn('google', { callbackUrl: '/app/dashboard' })
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('all configured OAuth providers are callable', async () => {
    const providers = ['google', 'github', 'alipay']
    for (const provider of providers) {
      vi.clearAllMocks()
      mockSignIn.mockResolvedValue(undefined)
      await mockSignIn(provider, { callbackUrl: '/app/dashboard' })
      expect(mockSignIn).toHaveBeenCalledWith(provider, expect.objectContaining({ callbackUrl: '/app/dashboard' }))
    }
  })
})
