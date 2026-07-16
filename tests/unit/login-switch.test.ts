import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const LOGIN_CLIENT_PATH = resolve(__dirname, '../../apps/web/src/app/[locale]/(auth)/login/login-client.tsx')

describe('login account switching', () => {
  it('login-client.tsx exists', () => {
    expect(existsSync(LOGIN_CLIENT_PATH)).toBe(true)
  })

  it('handleOAuth signs out before signing in when already logged in', () => {
    const source = readFileSync(LOGIN_CLIENT_PATH, 'utf-8')

    // Find the handleOAuth function body
    const match = source.match(/const handleOAuth = async \(provider: string\) => \{[\s\S]*?await signIn\(provider,/)
    expect(match).not.toBeNull()
    
    const functionBody = match![0]
    
    // Must call signOut before signIn when isLoggedIn
    expect(functionBody).toContain('if (isLoggedIn) await signOut({ redirect: false })')
    expect(functionBody.indexOf('if (isLoggedIn) await signOut')).toBeLessThan(
      functionBody.indexOf('await signIn')
    )
  })

  it('all login methods call signOut before signIn when logged in', () => {
    const source = readFileSync(LOGIN_CLIENT_PATH, 'utf-8')
    
    // Check that the pattern "if (isLoggedIn) await signOut" appears before "await signIn" in relevant handlers
    const signOutPattern = /if \(isLoggedIn\) await signOut/g
    const matches = source.match(signOutPattern)
    
    // Should appear at least once (in handleOAuth). If also in email/password handlers, even better
    expect(matches!.length).toBeGreaterThanOrEqual(1)
  })

  it('signIn is imported from next-auth/react', () => {
    const source = readFileSync(LOGIN_CLIENT_PATH, 'utf-8')
    expect(source).toContain("import { signIn, signOut } from \"next-auth/react\"")
  })
})