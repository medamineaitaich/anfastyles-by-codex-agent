import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getProductBySlug,
  getProductReviews,
  getProductsByIds,
  getVariations,
} from "@/lib/woo/client";
import { ProductDetailClient } from "@/components/product/product-detail-client";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [variations, reviews, relatedProducts, groupedProducts, session] = await Promise.all([
    product.type === "variable" ? getVariations(product.id) : Promise.resolve([]),
    getProductReviews(product.id),
    getProductsByIds(product.related_ids.slice(0, 4)),
    getProductsByIds(product.grouped_products),
    getSession(),
  ]);

  return (
    <ProductDetailClient
      product={product}
      variations={variations}
      reviews={reviews}
      relatedProducts={relatedProducts}
      groupedProducts={groupedProducts}
      isAuthenticated={Boolean(session)}
    />
  );
}
