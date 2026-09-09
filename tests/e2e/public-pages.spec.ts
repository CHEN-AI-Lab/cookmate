import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Public pages', () => {
  test('home page loads and shows content', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()

    // Hero section should have headline
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}/pricing`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()

    // Should mention pricing or plans
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/pricing|plan|price|pro/i)
  })

  test('login page loads', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}/login`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()

    // Should have login form fields
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}/register`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()

    // Should have a register/signup form
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('faq page loads', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}/faq`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('about page loads', async ({ page }) => {
    const response = await page.goto(`/${LOCALE}/about`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()
  })
})