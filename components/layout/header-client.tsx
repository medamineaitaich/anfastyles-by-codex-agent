"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

export function HeaderClient() {
  const pathname = usePathname();
  const router = useRouter();
  const { openDrawer, totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
    setSearchOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-sand/95 backdrop-blur">
      <div className="content-shell flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/70 md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="rounded-xl bg-white/90 p-1.5 shadow-[0_10px_24px_rgba(29,39,29,0.08)]"
            aria-label="AnfaStyles home"
          >
            <Image
              src="/branding/anfastyles-logo.webp"
              alt="AnfaStyles"
              width={1100}
              height={367}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-base font-semibold md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn("relative text-muted hover:text-ink", active && "text-ink")}
              >
                {link.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-2 h-[2px] rounded-full bg-forest" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/70"
            aria-label="Search products"
            onClick={() => setSearchOpen((current) => !current)}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/70"
            aria-label="Open cart"
            onClick={openDrawer}
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white">
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-white/10 bg-ink/95 text-white shadow-2xl shadow-black/20">
          <div className="content-shell py-4">
            <form className="flex gap-3" onSubmit={handleSubmit}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 focus:border-white/35"
                placeholder="Search products, collections, composting gear..."
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-ink hover:bg-sand"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm md:hidden">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-ink p-5 text-white shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between">
              <span className="display-font text-2xl font-semibold text-white">Menu</span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-10 space-y-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-lg font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
