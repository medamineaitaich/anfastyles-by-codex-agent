import "server-only";

import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { BRAND } from "@/lib/constants";
import type { WooAddress, WooOrder, WooOrderLineItem } from "@/lib/woo/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 34,
    paddingHorizontal: 38,
    backgroundColor: "#ffffff",
    color: "#1d271d",
    fontSize: 10.5,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 24,
    padding: 22,
    borderRadius: 16,
    backgroundColor: "#2f5725",
    color: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
  },
  invoiceMeta: {
    marginTop: 10,
    gap: 4,
  },
  invoiceMetaText: {
    fontSize: 10,
    color: "#edf5ea",
  },
  brandColumn: {
    width: 220,
    alignItems: "flex-end",
    gap: 4,
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  brandSubhead: {
    fontSize: 10,
    color: "#edf5ea",
  },
  brandDetail: {
    fontSize: 9.4,
    color: "#edf5ea",
    textAlign: "right",
  },
  contentRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9e4d2",
    backgroundColor: "#f8fbf6",
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#58714f",
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoKey: {
    color: "#58714f",
    width: 94,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#1d271d",
  },
  billedText: {
    color: "#40523d",
    marginTop: 2,
  },
  billedName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#1d271d",
  },
  table: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#dbe3d7",
    borderRadius: 14,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eef4ea",
    borderBottomWidth: 1,
    borderBottomColor: "#dbe3d7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Helvetica-Bold",
    color: "#46603f",
  },
  itemCol: {
    flex: 1.9,
    paddingRight: 10,
  },
  qtyCol: {
    width: 52,
    textAlign: "center",
  },
  priceCol: {
    width: 84,
    textAlign: "right",
  },
  totalCol: {
    width: 88,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1eb",
    alignItems: "flex-start",
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontFamily: "Helvetica-Bold",
    color: "#1d271d",
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 9.2,
    color: "#667262",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsCard: {
    width: 220,
    gap: 8,
    paddingTop: 4,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  totalLabel: {
    color: "#58714f",
  },
  totalValue: {
    minWidth: 70,
    textAlign: "right",
    color: "#1d271d",
  },
  grandTotal: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#cfd9cb",
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  footer: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#dbe3d7",
    gap: 4,
  },
  footerText: {
    fontSize: 9.6,
    color: "#64705f",
  },
  footerThanks: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2f5725",
  },
});

function formatUsd(value: string | number | undefined) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatInvoiceDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCustomerName(address: WooAddress) {
  const fullName = [address.first_name, address.last_name].filter(Boolean).join(" ").trim();
  return fullName || address.company || "Customer";
}

function formatCountry(code?: string) {
  if (!code) {
    return "";
  }

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function formatAddressLines(address: WooAddress) {
  const cityStateLine = [address.city, address.state].filter(Boolean).join(", ");
  const locationLine = [cityStateLine, address.postcode].filter(Boolean).join(" ");

  return [
    address.company || "",
    address.address_1 || "",
    address.address_2 || "",
    locationLine,
    formatCountry(address.country),
  ].filter(Boolean);
}

function formatItemMeta(item: WooOrderLineItem) {
  const meta = item.meta_data
    ?.filter((entry) => entry.value && !entry.key.startsWith("_"))
    .map((entry) => `${entry.key}: ${entry.value}`);

  return meta?.length ? meta.join(" • ") : "";
}

function getSubtotal(order: WooOrder) {
  return order.line_items.reduce(
    (sum, item) => sum + Number(item.subtotal || item.total || 0),
    0,
  );
}

function getItemUnitPrice(item: WooOrderLineItem) {
  if (Number.isFinite(item.price)) {
    return item.price;
  }

  if (item.quantity > 0) {
    return Number(item.total || 0) / item.quantity;
  }

  return 0;
}

function getBillingEmail(order: WooOrder) {
  return order.billing.email?.trim() || "";
}

function getBillingPhone(order: WooOrder) {
  return order.billing.phone?.trim() || "";
}

function InvoiceDocument({ order }: { order: WooOrder }) {
  const billedTo = formatCustomerName(order.billing);
  const addressLines = formatAddressLines(order.billing);
  const subtotal = getSubtotal(order);
  const shipping = Number(order.shipping_total || 0);
  const tax = Number(order.tax_total || 0);
  const total = Number(order.total || 0);
  const paymentMethod = order.payment_method_title || "Not specified";

  return (
    <Document
      title={`AnfaStyles Invoice ${order.number}`}
      author={BRAND.company}
      subject={`Invoice for order ${order.number}`}
      creator="AnfaStyles storefront"
      producer="AnfaStyles storefront"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <View style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaText}>Order #{order.number}</Text>
              <Text style={styles.invoiceMetaText}>Issued {formatInvoiceDate(order.date_created)}</Text>
            </View>
          </View>

          <View style={styles.brandColumn}>
            <Text style={styles.brandName}>{BRAND.name}</Text>
            <Text style={styles.brandSubhead}>Operated by {BRAND.company}</Text>
            <Text style={styles.brandDetail}>https://medaitllc.com</Text>
            <Text style={styles.brandDetail}>{BRAND.companyEmail}</Text>
            <Text style={styles.brandDetail}>{BRAND.phone}</Text>
            <Text style={styles.brandDetail}>1209 Mountain Road Place Northeast STE R</Text>
            <Text style={styles.brandDetail}>Albuquerque, NM 87110</Text>
            <Text style={styles.brandDetail}>United States</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Invoice information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Invoice number</Text>
                <Text style={styles.infoValue}>#{order.number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Order ID</Text>
                <Text style={styles.infoValue}>{String(order.id)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Date</Text>
                <Text style={styles.infoValue}>{formatInvoiceDate(order.date_created)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Payment method</Text>
                <Text style={styles.infoValue}>{paymentMethod}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text style={styles.billedName}>{billedTo}</Text>
            {addressLines.map((line) => (
              <Text key={line} style={styles.billedText}>
                {line}
              </Text>
            ))}
            {getBillingEmail(order) ? (
              <Text style={styles.billedText}>{getBillingEmail(order)}</Text>
            ) : null}
            {getBillingPhone(order) ? (
              <Text style={styles.billedText}>{getBillingPhone(order)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.itemCol}>Item</Text>
            <Text style={styles.qtyCol}>Qty</Text>
            <Text style={styles.priceCol}>Price</Text>
            <Text style={styles.totalCol}>Total</Text>
          </View>

          {order.line_items.map((item, index) => {
            const itemMeta = formatItemMeta(item);
            const isLast = index === order.line_items.length - 1;

            return (
              <View
                key={item.id}
                style={isLast ? [styles.tableRow, styles.lastTableRow] : styles.tableRow}
              >
                <View style={styles.itemCol}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {itemMeta ? <Text style={styles.itemMeta}>{itemMeta}</Text> : null}
                </View>
                <Text style={styles.qtyCol}>{String(item.quantity)}</Text>
                <Text style={styles.priceCol}>{formatUsd(getItemUnitPrice(item))}</Text>
                <Text style={styles.totalCol}>{formatUsd(item.total)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalsCard}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatUsd(subtotal)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>{formatUsd(shipping)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatUsd(tax)}</Text>
            </View>
            <View style={[styles.totalLine, styles.grandTotal]}>
              <Text>Total</Text>
              <Text style={styles.totalValue}>{formatUsd(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {BRAND.company} • https://medaitllc.com • {BRAND.companyEmail} • {BRAND.phone}
          </Text>
          <Text style={styles.footerText}>
            1209 Mountain Road Place Northeast STE R, Albuquerque, NM 87110, United States
          </Text>
          <Text style={styles.footerThanks}>Thank you for supporting {BRAND.name}.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function buildInvoicePdf(order: WooOrder) {
  return renderToBuffer(<InvoiceDocument order={order} />);
}
