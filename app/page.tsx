import { ArrowRight, Leaf, PackageCheck, Sprout, Truck } from "lucide-react";
import Image from "next/image";
import { FAQ_ITEMS, TRUST_BADGES } from "@/lib/constants";
import { getFeaturedProducts, getLatestProducts } from "@/lib/woo/client";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductGrid } from "@/components/shop/product-grid";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { NewsletterForm } from "@/components/home/newsletter-form";

export default async function HomePage() {
  const [featuredProducts, latestProducts] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
  ]);

  return (
    <div className="space-y-20 pb-8">
      <section className="relative isolate overflow-hidden text-white">
        <div className="relative flex min-h-[60vh] items-center justify-center lg:min-h-[70vh]">
          <Image
            src="/images/home-hero-banner.webp"
            alt="Nature-inspired graphic t-shirts displayed in a lush green garden setting."
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12),rgba(0,0,0,0.36))]" />

          <div className="content-shell relative z-10 flex w-full items-center justify-center px-6 py-24 text-center sm:px-10 lg:py-28">
            <div className="max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
              <h1 className="display-font text-4xl font-semibold leading-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-7xl">
                Wear What You Believe In
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/92 sm:text-lg sm:leading-8">
                Nature inspired apparel for gardeners, permaculture lovers and eco-conscious people.
              </p>
              <div className="mt-8 flex justify-center">
                <ButtonLink
                  href="/shop"
                  className="bg-white text-ink shadow-[0_18px_40px_rgba(0,0,0,0.25)] hover:bg-sand"
                >
                  Shop Now
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-shell">
        <div className="grid gap-4 md:grid-cols-4">
          {TRUST_BADGES.map((badge, index) => {
            const Icon = [ArrowRight, Truck, PackageCheck, Leaf][index];
            return (
              <article
                key={badge.title}
                className="rounded-[1.8rem] border border-border/60 bg-transparent px-6 py-7 shadow-none"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="display-font mt-5 text-2xl font-semibold text-ink">{badge.title}</h2>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-shell space-y-8">
        <SectionHeading
          eyebrow="Fresh Drops"
          title="New arrivals with a softer footprint"
        />
        <ProductGrid products={latestProducts.slice(0, 4)} />
      </section>

      <section className="content-shell space-y-8">
        <SectionHeading
          eyebrow="Featured"
          title="Latest Harvest"
          description="A curated mix of best-known pieces and recent additions from the WooCommerce catalog."
        />
        <ProductGrid products={(featuredProducts as Awaited<typeof featuredProducts>).slice(0, 8)} />
      </section>

      <section className="content-shell">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionHeading
            eyebrow="Conscious Creation"
            title="Printed only after ordering, so production starts with intention."
            description="We keep inventory light, reduce textile waste, and focus on a slower, more thoughtful buying experience."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "You Order",
                copy: "Choose the piece that fits your routine and place your order securely.",
              },
              {
                step: "2",
                title: "We Print",
                copy: "Your design is produced after purchase using a measured, low-waste workflow.",
              },
              {
                step: "3",
                title: "It Ships",
                copy: "Your item is packed and shipped once production is complete, usually within a short window.",
              },
            ].map((item) => (
              <article key={item.step} className="card-surface rounded-[1.8rem] p-6">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                  {item.step}
                </div>
                <h3 className="display-font mt-5 text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-shell space-y-8">
        <SectionHeading
          align="center"
          eyebrow="Questions"
          title="Frequently asked questions"
          description="Straight answers on shipping, sustainability, and how the print-on-demand model works."
        />
        <div className="mx-auto max-w-4xl">
          <FaqAccordion items={FAQ_ITEMS.map((item) => ({ ...item }))} />
        </div>
      </section>

      <section className="content-shell">
        <div className="hero-panel overflow-hidden rounded-[2.4rem] px-6 py-14 text-center text-white sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/12">
              <Sprout className="h-7 w-7" />
            </div>
            <h2 className="display-font mt-6 text-4xl font-semibold sm:text-5xl">
              Join the Soil Community
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/84">
              Get 10% off your first order, plus updates on new sustainable drops and practical permaculture-minded notes.
            </p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
