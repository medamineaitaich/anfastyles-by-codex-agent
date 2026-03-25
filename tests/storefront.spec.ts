import { expect, test } from "@playwright/test";

test("homepage and shop load with live products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Wear What You Believe In/i })).toBeVisible();

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

test("authenticated customer can reach checkout and see the live payment step", async ({ page }) => {
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

  await expect(page.getByRole("heading", { name: /Complete your order/i })).toBeVisible();
  await page.getByLabel(/Phone/i).fill("2027737432");
  await page.getByLabel(/^Address \*/i).fill("1209 Mountain Road Place Northeast STE R");
  await page.getByLabel(/Apartment \/ Suite \/ Unit/i).fill("Suite R");
  await page.getByLabel(/^Country \*/i).fill("US");
  await page.getByLabel(/^State \*/i).fill("NM");
  await page.getByLabel(/^City \*/i).fill("Albuquerque");

  await expect(page.getByRole("heading", { name: /Secure payment/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Complete payment details|Place order/i })).toBeVisible();
});

test("logout and login cycle work with Woo-backed auth", async ({ page }) => {
  const stamp = Date.now();
  const email = `codex-login-cycle-${stamp}@example.com`;
  const password = "Codex!Test123";

  await page.goto("/register");
  await page.getByLabel("First Name").fill("Codex");
  await page.getByLabel("Last Name").fill("Cycle");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });

  await page.getByRole("button", { name: /Logout/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20000 });

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

test("profile updates refresh account UI immediately and after reload", async ({ page }) => {
  const stamp = Date.now();
  const email = `codex-profile-${stamp}@example.com`;
  const password = "Codex!Test123";
  const firstName = "Codex";
  const updatedFirstName = "Forest";

  await page.goto("/register");
  await page.getByLabel("First Name").fill(firstName);
  await page.getByLabel("Last Name").fill("Profile");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: new RegExp(`Hello, ${firstName}`, "i") })).toBeVisible();

  const firstNameInput = page.getByLabel("First Name");
  await firstNameInput.fill(updatedFirstName);
  await page.getByRole("button", { name: /Save changes/i }).click();

  await expect(page.getByText("Account updated.")).toBeVisible();
  await expect(firstNameInput).toHaveValue(updatedFirstName);
  await expect(
    page.getByRole("heading", { name: new RegExp(`Hello, ${updatedFirstName}`, "i") }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: new RegExp(`Hello, ${updatedFirstName}`, "i") }),
  ).toBeVisible();
  await expect(page.getByLabel("First Name")).toHaveValue(updatedFirstName);
});
