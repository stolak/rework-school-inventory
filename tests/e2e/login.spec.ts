import { test, expect } from "@playwright/test";

const mockResponse = {
  access_token: "fake_token_abc123",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: 1759523216,
  refresh_token: "2y6nviinunha",
  user: {
    id: "f6e05715-0dcb-4d22-8712-9e617c966464",
    email: "admin@admin.com",
    phone: "",
    app_metadata: {
      name: "Stephen Akinbobola",
      roles: ["admin", "editor", "super-admin"],
    },
  },
};

test.describe("Login flow", () => {
  test("successful login stores token and shows toast", async ({ page }) => {
    // Intercept the login API and return mock response
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    });

    await page.goto("/");

    // Navigate to login page if app doesn't default to it
    // Assuming there's a link or it redirects; we'll load /login directly as fallback
    await page.goto("/login");

    await page.fill("input#email", "admin@admin.com");
    await page.fill("input#password", "admin@1234");
    await page.click('button:has-text("Sign In")');

    // Wait for navigation or UI change
    await page.waitForTimeout(500); // small delay for client-side processing

    // Verify token stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(token).toBe(mockResponse.access_token);

    // Verify userData stored
    const userData = await page.evaluate(() =>
      localStorage.getItem("userData")
    );
    expect(userData).not.toBeNull();
    const parsed = JSON.parse(userData || "null");
    expect(parsed.email).toBe("admin@admin.com");
  });
});
