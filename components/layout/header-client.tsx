"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
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

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
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
              className="py-1"
              aria-label="AnfaStyles home"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(false);
              }}
            >
              <Image
                src="/branding/anfastyles-logo.png"
                alt="AnfaStyles"
                width={1100}
                height={367}
                priority
                className="h-12 w-auto sm:h-14"
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
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(false);
                  }}
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
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[70] h-dvh bg-[#1a2d1e] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="content-shell flex h-full min-h-dvh flex-col overflow-y-auto pb-8 pt-6 text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">
                  Navigation
                </p>
                <Link href="/" className="block py-1" onClick={() => setMobileOpen(false)}>
                  <Image
                    src="/branding/anfastyles-logo.png"
                    alt="AnfaStyles"
                    width={1100}
                    height={367}
                    priority
                    className="h-10 w-auto brightness-0 invert"
                  />
                </Link>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white text-ink shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-7 rounded-[1.8rem] border border-white/8 bg-white/6 px-5 py-5">
              <p className="text-sm leading-7 text-white/72">
                Thoughtful pieces, printed with calm intention and made to fit everyday rituals.
              </p>
            </div>
            <nav className="mt-7 space-y-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-[1.6rem] border px-5 py-4 text-base font-semibold shadow-[0_14px_34px_rgba(0,0,0,0.08)]",
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "border-white bg-white text-[#1a2d1e]"
                      : "border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{link.label}</span>
                  <span className="text-sm opacity-60">/</span>
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-8">
              <div className="rounded-[1.8rem] border border-white/8 bg-[#223827] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  AnfaStyles
                </p>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Clean essentials, grounded tones, and a quieter shopping experience on every
                  screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
