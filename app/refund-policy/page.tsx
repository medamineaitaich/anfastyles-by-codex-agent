import { ButtonLink } from "@/components/ui/button";

export default function RefundPolicyPage() {
  return (
    <section className="content-shell py-16">
      <div className="card-surface mx-auto max-w-4xl p-8">
        <h1 className="display-font text-5xl font-semibold text-ink">Refund and Return Policy</h1>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink">English Version</p>
        <p className="mt-2 text-sm text-muted">Last Updated: March 13, 2026</p>
        <p className="mt-6 text-base leading-8 text-muted">
          At anfastyles, operated by MEDAIT LLC, we take pride in the quality of our products. Because
          our items are custom-printed and manufactured specifically for you upon order, our return
          policy differs from traditional retail stores.
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-ink">1. No Returns for "Change of Mind"</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Since every product is made-to-order, we cannot accept returns or issue refunds if you
              change your mind, ordered the wrong size, or simply do not like the product. Please
              review our size charts and product descriptions carefully before completing your
              purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">2. Eligibility for Replacement or Refund</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              We only offer replacements or refunds for items that are:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-muted">
              <li>Damaged or defective: items that arrive broken, torn, or with manufacturing flaws.</li>
              <li>Incorrect items: if you receive a different size, color, or design than what you ordered.</li>
              <li>Poor print quality: if the print is noticeably blurry, peeling, or off-center.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">3. Reporting Period & Requirements</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              To be eligible for a resolution, you must contact us at contact@anfastyles.shop within
              30 days of receiving your order.
            </p>
            <p className="mt-3 text-base font-semibold text-ink">Required Evidence:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6 text-base leading-7 text-muted">
              <li>Clear photos of the affected item(s) showing the defect or error.</li>
              <li>A clear photo of the shipping label and packaging.</li>
              <li>Your order number and the email address used for the purchase.</li>
            </ul>
            <p className="mt-3 text-base leading-7 text-muted">
              Note: Please do not discard the item or packaging until your claim has been reviewed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">4. Order Cancellations</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              We allow order cancellations within 24 hours of purchase. After 24 hours, your order
              enters the production phase and cannot be canceled or modified, as the manufacturing
              costs have already been incurred.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">5. Sale Items</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              All items purchased during a "Sale" or using a promotional discount code are
              considered final sale and are not eligible for return, exchange, or refund unless they
              arrive damaged or defective.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">6. Shipping Costs for Returns</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              If we request that an item be returned to our facility, the customer is responsible
              for paying all return shipping costs. Shipping fees, taxes, and handling charges from
              the original order are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">7. Refund Processing</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Once your claim is approved (and the return is received, if requested), we will
              process your refund.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-muted">
              <li>Processing time: refunds take approximately 10 business days to be processed.</li>
              <li>
                Method: the refund will be automatically applied to your original method of payment
                (PayPal, credit card, etc.). Please note that your bank or credit card company may
                take additional time to post the transaction to your statement.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-10">
          <ButtonLink href="/contact?subject=refund">Request a refund</ButtonLink>
        </div>
      </div>
    </section>
  );
}
