"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import type { WooProduct } from "@/lib/woo/types";
import { formatWooPrice, stripHtml } from "@/lib/utils";

export function ProductCard({
  product,
  action,
}: {
  product: WooProduct;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  const router = useRouter();
  const image = product.images[0];
  const canQuickAdd = product.type === "simple" || product.type === "variable";

  return (
    <article
      className="group card-surface cursor-pointer overflow-hidden rounded-[2rem]"
      onClick={() => router.push(`/shop/${product.slug}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/shop/${product.slug}`);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
    >
      <div className="relative aspect-[4/4.2] overflow-hidden bg-[#e8eef0]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : null}
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            {product.categories[0]?.name ?? "Collection"}
          </p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="display-font text-2xl font-semibold text-ink">{product.name}</h3>
              <p className="mt-1 max-w-[17rem] text-sm text-muted">
                {stripHtml(product.short_description || product.description).slice(0, 88)}
              </p>
            </div>
            <p className="text-base font-semibold text-forest">
              {formatWooPrice(product.price || product.regular_price || 0)}
            </p>
          </div>
        </div>
        {action && canQuickAdd ? (
          <Button
            className="w-full gap-2"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              action.onClick();
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            {action.label}
          </Button>
        ) : (
          <ButtonLink
            href={`/shop/${product.slug}`}
            variant="secondary"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {product.type === "grouped" ? "View collection" : "View product"}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
