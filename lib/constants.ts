export const BRAND = {
  name: "AnfaStyles",
  company: "MEDAIT LLC",
  storeEmail: "contact@anfastyles.shop",
  companyEmail: "contact@medaitllc.com",
  email: "contact@medaitllc.com",
  phone: "+1 202-773-7432",
  address: "1209 Mountain Road Place Northeast STE R, Albuquerque, NM 87110",
  shortDescription:
    "Premium apparel and essentials for people rooted in soil, composting, permaculture, and zero-waste communities.",
  shippingNote: "Free shipping on orders over $75",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
] as const;

export const SUPPORT_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
  { href: "/refund-policy", label: "Refund" },
] as const;

export const ACCOUNT_NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Order History" },
  { href: "/account/tracking", label: "Order Tracking" },
] as const;

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FLAT_SHIPPING_CENTS = 1000;

export const TRUST_BADGES = [
  {
    title: "Fast Shipping",
    copy: "Carbon-conscious fulfillment with tracked delivery across the US.",
  },
  {
    title: "Free Shipping over $75",
    copy: "Build your order around a thoughtful wardrobe, not wasteful impulse buys.",
  },
  {
    title: "30-Day Refunds",
    copy: "A clear, customer-friendly policy for damaged or unsatisfactory items.",
  },
  {
    title: "Print on Demand",
    copy: "Each piece is made after ordering to avoid overproduction and landfill waste.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "How does print on demand support a lower-waste model?",
    answer:
      "We make each item after you place your order, which helps avoid excess inventory, unnecessary markdown cycles, and unsold stock heading to landfill.",
  },
  {
    question: "How long does shipping usually take?",
    answer:
      "Most US orders arrive within 3 to 5 business days after the short production window. For destinations outside the US, contact us and we will confirm available options.",
  },
  {
    question: "Can I track my order from my account?",
    answer:
      "Yes. Logged-in customers can review order history, status, and order details from the account dashboard.",
  },
  {
    question: "What if I need a refund or replacement?",
    answer:
      "We keep the process straightforward. Review the refund policy, then contact support with your order number and we will help you quickly.",
  },
] as const;

