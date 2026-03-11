import type { WooOrder } from "@/lib/woo/types";

function formatMoney(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function sanitizePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toInvoiceLines(order: WooOrder) {
  const subtotal = order.line_items.reduce(
    (total, item) => total + Number(item.subtotal || item.total || 0),
    0,
  );
  const shipping = Number(order.shipping_total || 0);

  const lines: string[] = [
    `AnfaStyles Invoice`,
    `Order #: ${order.number}`,
    `Order date: ${new Date(order.date_created).toLocaleDateString("en-US")}`,
    "",
    "Billing details",
    `${order.billing.first_name || ""} ${order.billing.last_name || ""}`.trim(),
    order.billing.address_1 || "",
    order.billing.address_2 || "",
    `${order.billing.city || ""}, ${order.billing.state || ""} ${order.billing.postcode || ""}`.trim(),
    order.billing.country || "",
    order.billing.email || "",
    order.billing.phone || "",
    "",
    "Shipping details",
    `${order.shipping.first_name || ""} ${order.shipping.last_name || ""}`.trim(),
    order.shipping.address_1 || "",
    order.shipping.address_2 || "",
    `${order.shipping.city || ""}, ${order.shipping.state || ""} ${order.shipping.postcode || ""}`.trim(),
    order.shipping.country || "",
    "",
    "Items",
    ...order.line_items.map(
      (item) =>
        `${item.name} | Qty ${item.quantity} | Unit ${formatMoney(item.price)} | Total ${formatMoney(item.total)}`,
    ),
    "",
    `Subtotal: ${formatMoney(subtotal)}`,
    `Shipping: ${formatMoney(shipping)}`,
    `Total: ${formatMoney(order.total)}`,
  ];

  return lines.filter((line) => line !== undefined);
}

function buildPdfTextStream(lines: string[]) {
  const startY = 800;
  const lineHeight = 16;
  const textCommands = ["BT", "/F1 11 Tf", "50 0 0 50 40 0 Tm"];

  lines.forEach((line, index) => {
    const y = startY - index * lineHeight;
    if (y < 40) {
      return;
    }

    textCommands.push(`1 0 0 1 50 ${y} Tm (${sanitizePdfText(line)}) Tj`);
  });

  textCommands.push("ET");
  return textCommands.join("\n");
}

export function buildInvoicePdf(order: WooOrder) {
  const textStream = buildPdfTextStream(toInvoiceLines(order));
  const streamLength = Buffer.byteLength(textStream, "utf8");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  });

  const xrefPosition = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
