import { SectionHeading } from "@/components/ui/section-heading";

export default function AboutPage() {
  return (
    <section className="content-shell py-16">
      <div className="max-w-4xl space-y-10">
        <SectionHeading
          align="center"
          eyebrow="About AnfaStyles"
          title="Planting seeds for a lower-waste future."
          description="AnfaStyles exists for people who want apparel that reflects how they live: intentionally, gently, and with respect for the systems that sustain us."
        />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface min-h-96 rounded-[2rem] bg-[linear-gradient(135deg,#dbe7d6,#bfd3b3)]" />
          <div className="space-y-8">
            <article className="card-surface p-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Our Roots</h2>
              <p className="mt-4 text-base leading-8 text-muted">
                AnfaStyles grew from the idea that sustainable living deserves better design. We focus on a softer visual language, transparent fulfillment, and a print-on-demand model that avoids unnecessary inventory.
              </p>
            </article>
            <article className="card-surface p-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Our Mission</h2>
              <p className="mt-4 text-base leading-8 text-muted">
                We want the storefront to feel as thoughtful as the lifestyle it represents: clean, trustworthy, grounded, and built for long-term growth. Every piece is produced after ordering, so the collection expands without defaulting to excess.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
