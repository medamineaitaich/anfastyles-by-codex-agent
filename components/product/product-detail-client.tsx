"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-grid";
import { RatingStars } from "@/components/ui/rating-stars";
import { RichText } from "@/components/ui/rich-text";
import { formatDate, formatWooPrice } from "@/lib/utils";
import { resolveSwatch } from "@/lib/swatch";
import { useCart } from "@/providers/cart-provider";
import type { WooProduct, WooReview, WooVariation } from "@/lib/woo/types";

function normalizeAttributes(value?: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(value ?? {}).map(([key, option]) => [key.toLowerCase(), option.toLowerCase()]),
  );
}

function findMatchingVariation(variations: WooVariation[], attributes: Record<string, string>) {
  if (!variations.length) {
    return null;
  }

  const normalized = normalizeAttributes(attributes);
  return (
    variations.find((variation) =>
      variation.attributes.every((attribute) => {
        const option = attribute.option?.toLowerCase();
        if (!option) {
          return true;
        }

        const selected =
          normalized[attribute.name.toLowerCase()] ?? normalized[attribute.slug.toLowerCase()];
        return !selected || selected === option;
      }),
    ) ?? variations[0]
  );
}

export function ProductDetailClient({
  product,
  variations,
  relatedProducts,
  groupedProducts,
  reviews,
  isAuthenticated,
}: {
  product: WooProduct;
  variations: WooVariation[];
  relatedProducts: WooProduct[];
  groupedProducts: WooProduct[];
  reviews: WooReview[];
  isAuthenticated: boolean;
}) {
  const { addItem } = useCart();
  const initialAttributes = Object.fromEntries(
    product.attributes
      .filter((attribute) => attribute.options?.length)
      .map((attribute) => [attribute.name, attribute.options?.[0] ?? ""]),
  );
  const [selectedAttributes, setSelectedAttributes] =
    useState<Record<string, string>>(initialAttributes);
  const [quantity, setQuantity] = useState(1);
  const defaultMainImage =
    product.images[0]?.src || groupedProducts[0]?.images[0]?.src || "";
  const [activeImage, setActiveImage] = useState(defaultMainImage);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const selectedVariation = useMemo(
    () => findMatchingVariation(variations, selectedAttributes),
    [selectedAttributes, variations],
  );

  const gallery = useMemo(() => {
    const hero =
      selectedVariation?.image?.src ||
      activeImage ||
      product.images[0]?.src ||
      groupedProducts[0]?.images[0]?.src ||
      "";

    const merged = [
      hero,
      ...product.images.map((image) => image.src),
      ...variations.map((variation) => variation.image?.src ?? "").filter(Boolean),
    ];

    return Array.from(new Set(merged.filter(Boolean)));
  }, [activeImage, groupedProducts, product.images, selectedVariation?.image?.src, variations]);

  const displayPrice = selectedVariation?.price || product.price || product.regular_price;
  const displayDescription = selectedVariation?.description || product.description;


  function addCurrentSelection() {
    if (product.type === "grouped" || product.type === "external") {
      return;
    }

    addItem({
      productId: product.id,
      variationId: selectedVariation?.id,
      slug: product.slug,
      name: product.name,
      image: selectedVariation?.image?.src || gallery[0] || "",
      priceCents: Math.round(Number(displayPrice || 0) * 100),
      type: product.type,
      quantity,
      selectedAttributes,
    });
  }

  async function submitReview() {
    setReviewMessage(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        rating: reviewRating,
        review: reviewBody,
      }),
    });

    const payload = (await response.json()) as { message?: string };
    setReviewMessage(payload.message ?? (response.ok ? "Review submitted." : "Unable to submit review."));
    if (response.ok) {
      setReviewBody("");
      setReviewRating(5);
    }
  }

  return (
    <section className="content-shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#dde8ea]">
            {gallery[0] ? (
              <Image
                src={activeImage || gallery[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {gallery.slice(0, 4).map((image) => (
              <button
                key={image}
                type="button"
                className={`relative aspect-square overflow-hidden rounded-[1.1rem] border ${activeImage === image ? "border-forest" : "border-border"}`}
                onClick={() => setActiveImage(image)}
              >
                <Image src={image} alt={product.name} fill className="object-cover" sizes="120px" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-forest/70">
              {product.categories[0]?.name ?? "Collection"}
            </p>
            <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-semibold text-forest">{formatWooPrice(displayPrice || 0)}</p>
            <div className="mt-4 flex items-center gap-3">
              <RatingStars rating={Number(product.average_rating || 0)} />
              <span className="text-sm text-muted">
                {reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}
              </span>
            </div>
          </div>

          <RichText html={product.short_description || displayDescription} />

          {product.type !== "grouped" ? (
            <div className="space-y-5 rounded-[2rem] border border-border bg-white/80 p-5">
              {product.attributes.map((attribute) => (
                <div key={attribute.name} className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    {attribute.name}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(attribute.options ?? []).map((option) => {
                      const selected = selectedAttributes[attribute.name] === option;
                      const isColor = attribute.name.toLowerCase().includes("color");
                      return (
                        <button
                          key={option}
                          type="button"
                          className={
                            isColor
                              ? `group relative inline-flex h-11 w-11 items-center justify-center rounded-full border-2 ${selected ? "border-forest" : "border-white"}`
                              : `rounded-full border px-4 py-2 text-sm font-semibold ${selected ? "border-forest bg-forest text-white" : "border-border bg-white text-ink"}`
                          }
                          onClick={() =>
                            setSelectedAttributes((current) => {
                              const nextAttributes = { ...current, [attribute.name]: option };
                              const nextVariation = findMatchingVariation(variations, nextAttributes);
                              setActiveImage(nextVariation?.image?.src || defaultMainImage);
                              return nextAttributes;
                            })
                          }
                          title={option}
                        >
                          {isColor ? (
                            <span
                              className="h-8 w-8 rounded-full border border-black/5"
                              style={{ backgroundColor: resolveSwatch(option) }}
                            />
                          ) : (
                            option
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-border bg-white">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center"
                    onClick={() => setQuantity((current) => current + 1)}
                  >
                    +
                  </button>
                </div>
                <Button className="flex-1" onClick={addCurrentSelection}>
                  Add to cart
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-[2rem] border border-border bg-white/80 p-5">
              <h2 className="display-font text-3xl font-semibold text-ink">Included styles</h2>
              {groupedProducts.map((child) => (
                <div key={child.id} className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink">{child.name}</p>
                    <p className="text-sm text-muted">{formatWooPrice(child.price || child.regular_price)}</p>
                  </div>
                  <Button
                    onClick={() =>
                      addItem({
                        productId: child.id,
                        slug: child.slug,
                        name: child.name,
                        image: child.images[0]?.src ?? "",
                        priceCents: Math.round(Number(child.price || child.regular_price || 0) * 100),
                        type: child.type,
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-[2rem] bg-forest p-5 text-white">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />
              <div>
                <h2 className="display-font text-3xl font-semibold">After You Order</h2>
                <p className="mt-2 text-sm leading-7 text-white/85">
                  This item is printed on demand after your order is placed. Please allow a short production window before shipment.
                </p>
              </div>
            </div>
          </div>

          {product.type === "external" ? (
            <ButtonLink href={product.external_url || product.permalink} className="w-full">
              {product.button_text || "Visit product"}
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div>
            <h2 className="display-font text-4xl font-semibold text-ink">Product details</h2>
            <RichText html={displayDescription} className="mt-4" />
          </div>
          <div>
            <h2 className="display-font text-4xl font-semibold text-ink">Customer reviews</h2>
            <div className="mt-6 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <article key={review.id} className="card-surface rounded-[1.7rem] p-5">
                    <RatingStars rating={review.rating} />
                    <h3 className="mt-3 text-xl font-semibold text-ink">{review.reviewer}</h3>
                    <p className="mt-1 text-sm text-muted">{formatDate(review.date_created)}</p>
                    <RichText html={review.review} className="mt-3" />
                  </article>
                ))
              ) : (
                <div className="card-surface rounded-[1.7rem] p-5 text-sm leading-7 text-muted">
                  No published reviews yet. This section is connected and ready for live WooCommerce reviews.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-surface h-fit rounded-[1.8rem] p-6">
          <h2 className="display-font text-3xl font-semibold text-ink">Leave a review</h2>
          {isAuthenticated ? (
            <div className="mt-6 space-y-4">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Rating
                <select
                  className="h-12 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none"
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} star{rating === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Your review
                <textarea
                  className="min-h-36 rounded-[1.5rem] border border-border bg-white/80 px-4 py-3 text-sm outline-none"
                  value={reviewBody}
                  onChange={(event) => setReviewBody(event.target.value)}
                  placeholder="Tell us how it fits, feels, or performs in daily life."
                />
              </label>
              <Button onClick={submitReview}>Submit review</Button>
              {reviewMessage ? <p className="text-sm text-muted">{reviewMessage}</p> : null}
            </div>
          ) : (
            <div className="mt-6 space-y-3 text-sm leading-7 text-muted">
              <p>Sign in to submit a verified review tied to your WooCommerce customer account.</p>
              <ButtonLink href="/login">Sign in</ButtonLink>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length ? (
        <div className="mt-20 space-y-8">
          <h2 className="display-font text-4xl font-semibold text-ink">Rooted in the same soil</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      ) : null}
    </section>
  );
}
