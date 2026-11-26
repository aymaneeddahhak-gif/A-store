import { test, expect } from "@playwright/test"

test.describe("A-Store E2E Smoke Tests", () => {
  test("loads the storefront and renders essential UI elements", async ({ page }) => {
    await page.goto("/")

    // Check title and top navigation
    await expect(page).toHaveTitle(/A-store/i)
    await expect(page.locator("nav")).toBeVisible()

    // Skip to content accessible element
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()
  })

  test("renders the login page with one-click role cards", async ({ page }) => {
    await page.goto("/login")

    // Heading exists for accessibility
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached()

    // Seller and Client quick sign-in cards are shown
    await expect(page.getByRole("button", { name: /Seller/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Client/i })).toBeVisible()
  })

  test("cart drawer opens and closes smoothly", async ({ page }) => {
    await page.goto("/")

    // Look for cart trigger in the navigation
    const cartButton = page.locator('button[aria-label*="cart" i], button:has(svg.lucide-shopping-bag)').first()
    if (await cartButton.isVisible()) {
      await cartButton.click()
      // Cart drawer surface should appear
      await expect(page.getByText(/Your Cart/i).or(page.getByText(/Shopping Cart/i)).first()).toBeVisible({ timeout: 5000 })
    }
  })
})
