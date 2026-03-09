import { expect, test } from "@playwright/test";

test("homepage and shop load with live products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Rooted in Nature/i })).toBeVisible();

  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: /All Products/i })).toBeVisible();
  await expect(page.getByText(/results found/i)).toBeVisible();
});

test("variable product can be added to cart", async ({ page }) => {
  await page.goto("/shop/v-neck-t-shirt");
  await expect(page.getByRole("heading", { name: /V-Neck T-Shirt/i })).toBeVisible();
  await page.getByTitle("Green").click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("heading", { name: /Your selection/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /V-Neck T-Shirt/i })).toBeVisible();
});

test("register, login state, and account dashboard work", async ({ page }) => {
  const stamp = Date.now();
  const email = `codex-anfastyles-${stamp}@example.com`;
  const password = "Codex!Test123";

  await page.goto("/register");
  await page.getByLabel("First Name").fill("Codex");
  await page.getByLabel("Last Name").fill("Storefront");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: /Hello, Codex/i })).toBeVisible();

  await page.getByRole("button", { name: /Logout/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20000 });

  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: /Hello, Codex/i })).toBeVisible();
});

test("authenticated checkout creates a Woo order visible in account history", async ({ page }) => {
  const stamp = Date.now();
  const email = `codex-checkout-${stamp}@example.com`;
  const password = "Codex!Test123";

  await page.goto("/register");
  await page.getByLabel("First Name").fill("Codex");
  await page.getByLabel("Last Name").fill("Checkout");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });

  await page.goto("/shop/beanie-with-logo");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: /Proceed to checkout/i }).click();

  await page.getByLabel("Phone").fill("2027737432");
  await page.getByLabel("Address").first().fill("1209 Mountain Road Place Northeast STE R");
  await page.getByLabel("Apartment").first().fill("Suite R");
  await page.getByLabel("City").first().fill("Albuquerque");
  await page.getByLabel("State").first().fill("NM");
  await page.getByLabel("Postcode").first().fill("87110");
  await page.getByLabel("Address").nth(1).fill("1209 Mountain Road Place Northeast STE R");
  await page.getByLabel("Apartment").nth(1).fill("Suite R");
  await page.getByLabel("City").nth(1).fill("Albuquerque");
  await page.getByLabel("State").nth(1).fill("NM");
  await page.getByLabel("Postcode").nth(1).fill("87110");

  await page.getByRole("button", { name: /^Place order$/i }).click();
  await expect(page).toHaveURL(/\/account\/orders\/\d+\?placed=1/, { timeout: 30000 });
  await expect(page.getByText(/Order #/i)).toBeVisible();
});

test("logout and login cycle work with Woo-backed auth", async ({ page }) => {
  const email = "codex.test.anfastyles+1@example.com";
  const password = "Codex!Test123";

  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });

  await page.getByRole("button", { name: /Logout/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
});
