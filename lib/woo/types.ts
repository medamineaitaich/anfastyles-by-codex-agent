export type WooImage = {
  id: number;
  src: string;
  thumbnail?: string;
  alt?: string;
  name?: string;
};

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description?: string;
  permalink?: string;
};

export type WooProductAttribute = {
  id: number;
  name: string;
  slug: string;
  variation: boolean;
  visible?: boolean;
  position?: number;
  options?: string[];
};

export type WooAttributeOption = {
  id?: number;
  name: string;
  slug: string;
  option?: string;
};

export type WooVariation = {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  description: string;
  on_sale: boolean;
  purchasable: boolean;
  image?: WooImage;
  attributes: WooAttributeOption[];
};

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: "simple" | "variable" | "grouped" | "external";
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  average_rating: string;
  rating_count: number;
  review_count?: number;
  reviews_allowed?: boolean;
  stock_status: string;
  stock_quantity: number | null;
  categories: WooCategory[];
  tags?: Array<{ id: number; name: string; slug: string }>;
  images: WooImage[];
  attributes: WooProductAttribute[];
  default_attributes: Array<{ id: number; name: string; option: string; slug?: string }>;
  variations: number[];
  grouped_products: number[];
  related_ids: number[];
  price_html?: string;
  external_url?: string;
  button_text?: string;
  meta_data?: Array<{ id: number; key: string; value: unknown }>;
};

export type WooReview = {
  id: number;
  date_created: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls?: Record<string, string>;
};

export type WooAddress = {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
};

export type WooCustomer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  billing: WooAddress;
  shipping: WooAddress;
};

export type WooOrderLineItem = {
  id: number;
  product_id: number;
  variation_id: number;
  quantity: number;
  price: number;
  subtotal: string;
  total: string;
  sku: string;
  name: string;
  image?: {
    id: string;
    src: string;
  };
  meta_data?: Array<{ id?: number; key: string; value: string }>;
};

export type WooOrder = {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  shipping_total: string;
  discount_total: string;
  payment_method: string;
  payment_method_title: string;
  customer_id: number;
  customer_note: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooOrderLineItem[];
  fee_lines?: Array<{ id: number; name: string; total: string }>;
  shipping_lines?: Array<{ id: number; method_title: string; total: string }>;
  payment_url?: string;
  needs_payment?: boolean;
};

export type CartItem = {
  key: string;
  productId: number;
  variationId?: number;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  quantity: number;
  type: WooProduct["type"];
  selectedAttributes?: Record<string, string>;
};
