import Link from "next/link";
import { BRAND, LEGAL_LINKS, NAV_LINKS, SUPPORT_LINKS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#27491d] text-white">
      <div className="content-shell py-16">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Link href="/" className="display-font text-3xl font-semibold">
              {BRAND.name}
            </Link>
            <p className="mt-5 text-sm leading-8 text-white/75">{BRAND.shortDescription}</p>
          </div>
          <div>
            <h3 className="display-font text-xl font-semibold">Shop</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li>
                <Link href="/shop">All Products</Link>
              </li>
              <li>
                <Link href="/shop?sort=newest">New Arrivals</Link>
              </li>
              {NAV_LINKS.filter((link) => link.href !== "/").map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="display-font text-xl font-semibold">Support</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="display-font text-xl font-semibold">Stay Connected</h3>
            <div className="mt-5 space-y-3 text-sm leading-7 text-white/80">
              <p>{BRAND.email}</p>
              <p>{BRAND.phone}</p>
              <p>{BRAND.address}</p>
              <p className="font-semibold text-white">{BRAND.shippingNote}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>{BRAND.company}</p>
          <p>© 2026 {BRAND.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
