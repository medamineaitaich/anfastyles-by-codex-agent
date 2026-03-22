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
  tax_total: string;
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

export type WooStoreMoney = {
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

export type WooStoreItemImage = {
  id: number;
  src: string;
  thumbnail?: string;
  srcset?: string;
  sizes?: string;
  name?: string;
  alt?: string;
};

export type WooStoreCartItemVariation = {
  raw_attribute?: string;
  attribute: string;
  value: string;
};

export type WooStoreCartItem = {
  key: string;
  id: number;
  type: "simple" | "variation";
  quantity: number;
  name: string;
  permalink: string;
  images: WooStoreItemImage[];
  variation: WooStoreCartItemVariation[];
  prices: WooStoreMoney & {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range: null | {
      min_amount: string;
      max_amount: string;
    };
    raw_prices?: {
      precision: number;
      price: string;
      regular_price: string;
      sale_price: string;
    };
  };
  totals: WooStoreMoney & {
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
  };
};

export type WooStoreShippingRate = WooStoreMoney & {
  rate_id: string;
  name: string;
  description: string;
  delivery_time: string;
  price: string;
  taxes: string;
  instance_id: number;
  method_id: string;
  selected: boolean;
  meta_data?: Array<{ key: string; value: string }>;
};

export type WooStoreShippingPackage = {
  package_id: number;
  name: string;
  destination: Omit<WooAddress, "first_name" | "last_name" | "company" | "email">;
  items: Array<{ key: string; name: string; quantity: number }>;
  shipping_rates: WooStoreShippingRate[];
};

export type WooStoreCart = {
  items: WooStoreCartItem[];
  coupons: unknown[];
  fees: unknown[];
  totals: WooStoreMoney & {
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_fees_tax: string;
    total_discount: string;
    total_discount_tax: string;
    total_shipping: string | null;
    total_shipping_tax: string | null;
    total_price: string;
    total_tax: string;
    tax_lines: unknown[];
  };
  shipping_address: WooAddress;
  billing_address: WooAddress;
  needs_payment: boolean;
  needs_shipping: boolean;
  payment_requirements: string[];
  has_calculated_shipping: boolean;
  shipping_rates: WooStoreShippingPackage[];
  items_count: number;
  items_weight: number;
  cross_sells: unknown[];
  errors: Array<{ code?: string; message?: string }>;
  payment_methods: string[];
  extensions: Record<string, unknown>;
};

export type WooStoreCheckoutPaymentDetail = {
  key: string;
  value: string;
};

export type WooStoreCheckout = {
  order_id: number;
  status: string;
  order_key: string;
  order_number: string;
  customer_note: string;
  customer_id: number;
  billing_address: WooAddress;
  shipping_address: WooAddress;
  payment_method: string;
  payment_result: {
    payment_status: string;
    payment_details: WooStoreCheckoutPaymentDetail[];
    redirect_url: string;
  };
  additional_fields?: Record<string, unknown>;
  __experimentalCart: unknown;
  extensions: Record<string, unknown>;
};
