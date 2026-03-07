import { ContactForm } from "@/components/contact/contact-form";
import { BRAND } from "@/lib/constants";

export default function ContactPage() {
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
        <ContactForm />
      </div>
      <div className="mt-12 text-center">
        <h2 className="display-font text-3xl font-semibold text-ink">Direct Response</h2>
        <p className="mt-4 text-base text-muted">
          Email: <span className="font-semibold text-forest">{BRAND.email}</span>
        </p>
      </div>
    </section>
  );
}
