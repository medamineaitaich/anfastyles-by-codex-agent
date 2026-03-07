"use client";

import { useCart } from "@/providers/cart-provider";
import { ProductCard } from "@/components/ui/product-card";
import type { WooProduct } from "@/lib/woo/types";

export function ProductGrid({ products }: { products: WooProduct[] }) {
  const { addItem } = useCart();

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          action={
            product.type === "simple"
              ? {
                  label: "Quick add",
                  onClick: () =>
                    addItem({
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      image: product.images[0]?.src ?? "",
                      priceCents: Math.round(Number(product.price || product.regular_price || 0) * 100),
                      type: product.type,
                      selectedAttributes: Object.fromEntries(
                        product.attributes
                          .filter((attribute) => attribute.options?.[0])
                          .map((attribute) => [attribute.name, attribute.options?.[0] ?? ""]),
                      ),
                    }),
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
