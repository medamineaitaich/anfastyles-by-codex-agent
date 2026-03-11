import { ContactForm } from "@/components/contact/contact-form";
import { BRAND } from "@/lib/constants";

type ContactPageProps = {
  searchParams: Promise<{ subject?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  return (
    <section className="content-shell py-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Contact</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          Get In Touch
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted">
          Have questions about your order, our materials, or shipping support? Leave us a message and we will respond as quickly as possible.
        </p>
      </div>
      <div className="mt-12">
        <ContactForm defaultSubject={params.subject} />
      </div>
      <div className="mt-12 text-center">
        <h2 className="display-font text-3xl font-semibold text-ink">Direct Response</h2>
        <p className="mt-4 text-base text-muted">
          Store email: <span className="font-semibold text-forest">{BRAND.storeEmail}</span>
        </p>
        <p className="mt-2 text-base text-muted">
          Company email: <span className="font-semibold text-forest">{BRAND.companyEmail}</span>
        </p>
      </div>
    </section>
  );
}
