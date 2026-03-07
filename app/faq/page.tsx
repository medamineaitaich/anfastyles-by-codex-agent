import { FaqAccordion } from "@/components/ui/faq-accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FaqPage() {
  return (
    <section className="content-shell py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">FAQ</p>
          <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Helpful answers
          </h1>
        </div>
        <FaqAccordion items={[...FAQ_ITEMS]} />
      </div>
    </section>
  );
}
