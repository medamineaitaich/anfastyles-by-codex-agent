import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSession } from "@/lib/session";
import { CartProvider } from "@/providers/cart-provider";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anfastyles.shop"),
  title: {
    default: "AnfaStyles | Rooted in Nature",
    template: "%s | AnfaStyles",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  description:
    "A premium headless WooCommerce storefront for sustainable apparel, zero-waste essentials, and nature-led living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = getSession();

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-sand text-ink antialiased`}>
        <CartProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top,_rgba(54,92,43,0.24),_transparent_60%)]" />
            <div className="pointer-events-none absolute left-[-10rem] top-[18rem] -z-10 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(188,145,95,0.18),_transparent_70%)] blur-3xl" />
            <div className="pointer-events-none absolute right-[-10rem] top-[42rem] -z-10 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(89,125,77,0.16),_transparent_70%)] blur-3xl" />
            <SiteHeader sessionPromise={session} />
            <main className="pt-20">{children}</main>
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
