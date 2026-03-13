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
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f4f0e8",
    color: "#1d271d",
    fontSize: 9.6,
    fontFamily: "Helvetica",
    lineHeight: 1.28,
  },
  sheet: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e1d6",
  },
  topAccent: {
    height: 4,
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: "#2f5725",
  },
  header: {
    marginBottom: 10,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e3da",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1d271d",
  },
  invoiceMeta: {
    gap: 1,
  },
  invoiceMetaText: {
    fontSize: 9.2,
    color: "#5e685a",
  },
  brandDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#e4ddd2",
  },
  brandColumn: {
    width: 164,
    alignItems: "flex-start",
    gap: 1,
  },
  brandName: {
    fontSize: 12.8,
    fontFamily: "Helvetica-Bold",
    color: "#2f5725",
    letterSpacing: 0.6,
  },
  brandSubhead: {
    fontSize: 8.7,
    color: "#4f5d4b",
  },
  contentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    padding: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#e4ddd3",
    backgroundColor: "#fbfaf7",
    gap: 7,
  },
  sectionLabel: {
    fontSize: 8.1,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#61725b",
  },
  infoGrid: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ece6dc",
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabelWrap: {
    width: 78,
  },
  infoKey: {
    color: "#6d7868",
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#1d271d",
    fontSize: 8.9,
  },
  billedName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.4,
    color: "#1d271d",
  },
  billedText: {
    color: "#556251",
    marginTop: 0,
    fontSize: 8.9,
  },
  tableSection: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e3ddd3",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  tableIntro: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: "#fbfaf7",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6dc",
  },
  tableTitle: {
    fontSize: 9.6,
    fontFamily: "Helvetica-Bold",
    color: "#1d271d",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f5ef",
    borderBottomWidth: 1,
    borderBottomColor: "#dde5d8",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    color: "#51634a",
    fontSize: 8.1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemCol: {
    flex: 1.9,
    paddingRight: 10,
  },
  qtyCol: {
    width: 42,
    textAlign: "center",
  },
  priceCol: {
    width: 68,
    textAlign: "right",
  },
  totalCol: {
    width: 74,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#efebe4",
    alignItems: "flex-start",
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontFamily: "Helvetica-Bold",
    color: "#1d271d",
    fontSize: 8.9,
    lineHeight: 1.2,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 7.8,
    color: "#6b7467",
    lineHeight: 1.15,
  },
  tableCellText: {
    fontSize: 8.7,
    color: "#1d271d",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  totalsCard: {
    width: 205,
    gap: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e3ddd3",
    borderRadius: 11,
    backgroundColor: "#fbfaf7",
  },
  totalsHeader: {
    marginBottom: 1,
  },
  totalsTitle: {
    fontSize: 8.3,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#61725b",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 1,
  },
  totalLabel: {
    color: "#61725b",
    fontSize: 8.6,
  },
  totalValue: {
    minWidth: 60,
    textAlign: "right",
    color: "#1d271d",
    fontSize: 8.8,
  },
  grandTotal: {
    marginTop: 3,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#d8d2c8",
    fontFamily: "Helvetica-Bold",
    fontSize: 10.2,
    color: "#2f5725",
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e7e1d7",
    gap: 2,
  },
  footerCompany: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    color: "#50604a",
  },
  footerText: {
    fontSize: 7.6,
    color: "#6d7569",
  },
  footerThanks: {
    marginTop: 2,
    fontSize: 7.9,
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

  return meta?.length ? meta.join(" | ") : "";
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

function InvoiceDocument({ order }: { order: WooOrder }) {
  const billedTo = formatCustomerName(order.billing);
  const addressLines = formatAddressLines(order.billing);
  const subtotal = getSubtotal(order);
  const shipping = Number(order.shipping_total || 0);
  const tax = Number(order.tax_total || 0);
  const total = Number(order.total || 0);
  const paymentMethod = order.payment_method_title || "Not specified";

  const invoiceRows = [
    ["Invoice number", `#${order.number}`],
    ["Order ID", String(order.id)],
    ["Date", formatInvoiceDate(order.date_created)],
    ["Payment method", paymentMethod],
  ] as const;

  return (
    <Document
      title={`AnfaStyles Invoice ${order.number}`}
      author={BRAND.company}
      subject={`Invoice for order ${order.number}`}
      creator="AnfaStyles storefront"
      producer="AnfaStyles storefront"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.sheet}>
          <View style={styles.topAccent} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.invoiceTitle}>Invoice</Text>
              <View style={styles.invoiceMeta}>
                <Text style={styles.invoiceMetaText}>Order #{order.number}</Text>
                <Text style={styles.invoiceMetaText}>Date {formatInvoiceDate(order.date_created)}</Text>
              </View>
            </View>

            <View style={styles.brandDivider} />

            <View style={styles.brandColumn}>
              <Text style={styles.brandName}>{BRAND.name.toUpperCase()}</Text>
              <Text style={styles.brandSubhead}>Operated by {BRAND.company}</Text>
            </View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>Invoice information</Text>
              <View style={styles.infoGrid}>
                {invoiceRows.map(([label, value], index) => (
                  <View
                    key={label}
                    style={
                      index === invoiceRows.length - 1
                        ? [styles.infoRow, styles.infoRowLast]
                        : styles.infoRow
                    }
                  >
                    <View style={styles.infoLabelWrap}>
                      <Text style={styles.infoKey}>{label}</Text>
                    </View>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ))}
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
            </View>
          </View>

          <View style={styles.tableSection}>
            <View style={styles.tableIntro}>
              <Text style={styles.tableTitle}>Items</Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.itemCol, styles.tableHeaderText]}>Item</Text>
                <Text style={[styles.qtyCol, styles.tableHeaderText]}>Qty</Text>
                <Text style={[styles.priceCol, styles.tableHeaderText]}>Price</Text>
                <Text style={[styles.totalCol, styles.tableHeaderText]}>Total</Text>
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
                    <Text style={[styles.qtyCol, styles.tableCellText]}>{String(item.quantity)}</Text>
                    <Text style={[styles.priceCol, styles.tableCellText]}>
                      {formatUsd(getItemUnitPrice(item))}
                    </Text>
                    <Text style={[styles.totalCol, styles.tableCellText]}>
                      {formatUsd(item.total)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalsCard}>
              <View style={styles.totalsHeader}>
                <Text style={styles.totalsTitle}>Summary</Text>
              </View>
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
            <Text style={styles.footerCompany}>{BRAND.company}</Text>
            <Text style={styles.footerText}>
              https://medaitllc.com | {BRAND.companyEmail} | {BRAND.phone}
            </Text>
            <Text style={styles.footerText}>
              1209 Mountain Road Place Northeast STE R | Albuquerque, NM 87110 | United States
            </Text>
            <Text style={styles.footerThanks}>Thank you for supporting {BRAND.name}.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function buildInvoicePdf(order: WooOrder) {
  return renderToBuffer(<InvoiceDocument order={order} />);
}
