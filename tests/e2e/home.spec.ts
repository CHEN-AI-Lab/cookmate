import { test, expect } from '@playwright/test'

test('home page loads and shows content', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  
  // Page should have at least some content
  const title = await page.title()
  expect(title).toBeTruthy()
})
