import { EmptyState } from "@/components/ui/empty-state";
import { ProductGrid } from "@/components/shop/product-grid";
import { getCategories, getProducts } from "@/lib/woo/client";
import { parseNumberParam } from "@/lib/utils";

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const category = typeof params.category === "string" ? params.category : "";
  const rating = typeof params.rating === "string" ? Number(params.rating) : undefined;
  const minPrice = parseNumberParam(typeof params.minPrice === "string" ? params.minPrice : undefined);
  const maxPrice = parseNumberParam(typeof params.maxPrice === "string" ? params.maxPrice : undefined);

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ search, sort, category, minPrice, maxPrice, minRating: rating }),
  ]);

  return (
    <section className="content-shell py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/70">Shop</p>
        <h1 className="display-font mt-3 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          All Products
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Ethically produced items for conscious consumers, backed by the live WooCommerce catalog.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="card-surface h-fit space-y-6 p-6">
          <form className="grid gap-6" method="get">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search products..."
              className="h-12 rounded-full border border-border bg-white px-4 text-sm outline-none"
            />
            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Categories</h2>
              <label className="flex items-center gap-3 text-sm text-muted">
                <input type="radio" name="category" value="" defaultChecked={!category} />
                All Categories
              </label>
              {categories.map((item) => (
                <label key={item.id} className="flex items-center gap-3 text-sm text-muted">
                  <input type="radio" name="category" value={item.slug} defaultChecked={category === item.slug} />
                  {item.name} ({item.count})
                </label>
              ))}
            </div>
            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Price Range</h2>
              <div className="flex gap-3">
                <input
                  name="minPrice"
                  defaultValue={minPrice ?? ""}
                  placeholder="Min $"
                  className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none"
                />
                <input
                  name="maxPrice"
                  defaultValue={maxPrice ?? ""}
                  placeholder="Max $"
                  className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none"
                />
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Minimum Rating</h2>
              <select
                name="rating"
                defaultValue={rating ? String(rating) : ""}
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm outline-none"
              >
                <option value="">Any rating</option>
                <option value="4">4 stars & up</option>
                <option value="3">3 stars & up</option>
                <option value="2">2 stars & up</option>
              </select>
            </div>
            <div className="space-y-3 border-t border-border pt-6">
              <h2 className="display-font text-3xl font-semibold text-ink">Sort</h2>
              <select
                name="sort"
                defaultValue={sort}
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
            <button type="submit" className="h-12 rounded-full bg-forest px-6 text-sm font-semibold text-white">
              Apply Filters
            </button>
          </form>
        </aside>

        <div className="space-y-6">
          <p className="text-sm text-muted">{products.length} results found</p>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState title="No products found" description="Try adjusting your search or filters." />
          )}
        </div>
      </div>
    </section>
  );
}
