import type { WooOrder } from "@/lib/woo/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function addressBlock(order: WooOrder, type: "billing" | "shipping") {
  const address = order[type];
  return [
    `${address.first_name || ""} ${address.last_name || ""}`.trim(),
    address.address_1,
    address.address_2,
    `${address.city || ""}${address.state ? `, ${address.state}` : ""} ${address.postcode || ""}`.trim(),
    address.country,
    type === "billing" ? address.email : "",
    type === "billing" ? address.phone : "",
  ]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
}

export function buildInvoiceHtml(order: WooOrder) {
  const subtotal = order.line_items.reduce((total, item) => total + Number(item.subtotal || item.total || 0), 0);
  const shipping = Number(order.shipping_total || 0);

  const itemRows = order.line_items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${formatMoney(item.price)}</td>
        <td style="text-align:right;">${formatMoney(item.total)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice #${escapeHtml(order.number)}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color: #1f2937; margin: 32px; }
      h1,h2,h3 { margin: 0; }
      .top { display:flex; justify-content:space-between; gap: 24px; margin-bottom: 28px; }
      .muted { color:#6b7280; font-size: 14px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 14px; }
      th { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; text-align:left; color:#6b7280; }
      .totals { margin-top: 20px; margin-left: auto; width: 320px; }
      .totals div { display:flex; justify-content:space-between; padding: 6px 0; }
      .totals .total { font-weight:700; font-size:18px; border-top:1px solid #d1d5db; margin-top:6px; padding-top:10px; }
    </style>
  </head>
  <body>
    <section class="top">
      <div>
        <h1>AnfaStyles Invoice</h1>
        <p class="muted">Order #${escapeHtml(order.number)}</p>
      </div>
      <div class="muted" style="text-align:right;">
        <div>Invoice Date: ${escapeHtml(new Date(order.date_created).toLocaleDateString("en-US"))}</div>
        <div>Status: ${escapeHtml(order.status)}</div>
      </div>
    </section>

    <section class="grid">
      <div>
        <h3>Billing Details</h3>
        <div class="muted">${addressBlock(order, "billing")}</div>
      </div>
      <div>
        <h3>Shipping Details</h3>
        <div class="muted">${addressBlock(order, "shipping")}</div>
      </div>
    </section>

    <section>
      <h3>Items</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </section>

    <section class="totals">
      <div><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
      <div><span>Shipping</span><span>${formatMoney(shipping)}</span></div>
      <div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div>
    </section>
  </body>
</html>`;
}
