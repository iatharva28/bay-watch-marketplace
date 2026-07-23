/**
 * BAY Marketplace — Data Layer
 *
 * Architecture: BAY is the marketplace. Three seller types:
 *   1. BAY's own brand (seller_type = 'own_brand')
 *   2. Authorized third-party brands (seller_type = 'authorized')
 *   3. Independent vendors (seller_type = 'vendor')
 *
 * Every product has a seller_id. BAY's own-brand products are owned
 * by a special seller account — never a boolean flag.
 *
 * Compliance (India):
 *   - GST 18% on watches above ₹500
 *   - TCS 1% on marketplace sales above ₹5L/year per seller
 *   - Seller KYC mandatory (PAN, GSTIN, bank)
 *   - Razorpay for payment routing
 */

export type SellerType = "own_brand" | "authorized" | "vendor";

export type Seller = {
  id: string;
  name: string;
  type: SellerType;
  /** Only present for non-own-brand sellers */
  city?: string;
  established?: number;
  /** Specialization — e.g. "Tourbillon", "Dress Watches" */
  specialty?: string;
  /** Verified by BAY — KYC complete */
  verified: boolean;
  /** BAY-authorized dealer (carries BAY's own warranty) */
  bayAuthorized: boolean;
  /** Commission rate BAY charges this seller (0 for own-brand) */
  commissionRate: number;
  /** Average rating from customer reviews */
  rating: number;
  reviewCount: number;
  /** Short brand story */
  story: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  /** Number of products in this category */
  count: number;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
};

export type ProductStatus = "active" | "low_stock" | "out_of_stock" | "preorder";

export type MarketplaceProduct = {
  id: string;
  slug: string;
  ref: string;
  name: string;
  sellerId: string;
  family: string;
  categoryId: string;
  tagline: string;
  description: string;
  fullDescription: string;
  complication: string;
  movement: string;
  caseMaterial: string;
  caseDiameter: string;
  waterResistance: string;
  powerReserve: string;
  production: string;
  /** Price in INR paise (smallest unit) — GST inclusive display computed at checkout */
  priceInr: number;
  /** MRP if different from selling price (for discount display) */
  mrpInr?: number;
  /** Stock count */
  stock: number;
  status: ProductStatus;
  year: number;
  dialColor: string;
  caseFinish: "polished-platinum" | "brushed-steel" | "sandblasted-titanium" | "obsidian-ceramic";
  complicationType:
    | "time-only"
    | "tourbillon"
    | "perpetual-calendar"
    | "minute-repeater"
    | "gmt"
    | "chronograph"
    | "diver"
    | "ultra-thin"
    | "skeleton"
    | "grand-sonnerie"
    | "astrological"
    | "grand-complication";
  limited?: boolean;
  featured?: boolean;
  /** Warranty period in months */
  warrantyMonths: number;
  /** Shipping: 0 = free, otherwise INR paise */
  shippingInr: number;
  /** Ships in N days */
  shipsInDays: number;
  reviews: Review[];
};

/* =================================================================
   SELLERS — BAY own-brand + third-party
   ================================================================= */

export const SELLERS: Seller[] = [
  {
    id: "bay-maison",
    name: "BAY Maison",
    type: "own_brand",
    established: 1947,
    specialty: "In-House Calibers",
    verified: true,
    bayAuthorized: true,
    commissionRate: 0,
    rating: 4.9,
    reviewCount: 1247,
    story:
      "Founded in Le Crêt-du-Locle in 1947, BAY Maison is the namesake brand of the marketplace. Every movement is conceived, drawn, prototyped, and assembled within the maison's own ateliers.",
  },
  {
    id: "horlogerie-geneve",
    name: "Horlogerie Genève",
    type: "authorized",
    city: "Geneva",
    established: 1958,
    specialty: "Grand Complications",
    verified: true,
    bayAuthorized: true,
    commissionRate: 12,
    rating: 4.8,
    reviewCount: 423,
    story:
      "An authorized dealer of three independent Swiss houses, Horlogerie Genève has been a fixture on Rue du Rhône since 1958. BAY-authorized for warranty and servicing.",
  },
  {
    id: "nakshatra-watches",
    name: "Nakshatra Watches",
    type: "vendor",
    city: "Mumbai",
    established: 2009,
    specialty: "Astrological Complications",
    verified: true,
    bayAuthorized: false,
    commissionRate: 14,
    rating: 4.7,
    reviewCount: 189,
    story:
      "Mumbai-based Nakshatra specializes in astrological and sidereal complications tuned to the Indian subcontinent. Each piece is hand-finished in their Andheri atelier.",
  },
  {
    id: "titan-craft",
    name: "Titan Craft",
    type: "vendor",
    city: "Bengaluru",
    established: 2014,
    specialty: "Skeleton & Open-Work",
    verified: true,
    bayAuthorized: false,
    commissionRate: 14,
    rating: 4.6,
    reviewCount: 312,
    story:
      "Titan Craft is a Bengaluru-based workshop known for skeletonised movements and open-worked dials. Their pieces bridge Swiss tradition with Indian craft sensibility.",
  },
  {
    id: "meridian-delhi",
    name: "Meridian Delhi",
    type: "authorized",
    city: "New Delhi",
    established: 2001,
    specialty: "Dress & Ultra-Thin",
    verified: true,
    bayAuthorized: true,
    commissionRate: 11,
    rating: 4.8,
    reviewCount: 256,
    story:
      "Meridian Delhi operates from The Oberoi and specializes in dress watches and ultra-thin calibers. BAY-authorized for the Delhi NCR region.",
  },
  {
    id: "abyss-marine",
    name: "Abyss Marine",
    type: "vendor",
    city: "Goa",
    established: 2017,
    specialty: "Dive Watches",
    verified: true,
    bayAuthorized: false,
    commissionRate: 13,
    rating: 4.5,
    reviewCount: 98,
    story:
      "A Goan workshop focused on dive watches rated to 300m+. Abyss Marine tests every piece in the Arabian Sea before it ships.",
  },
];

/* =================================================================
   CATEGORIES
   ================================================================= */

export const CATEGORIES: Category[] = [
  { id: "c1", name: "Flagship", slug: "flagship", count: 8 },
  { id: "c2", name: "Grand Complications", slug: "grand-complications", count: 6 },
  { id: "c3", name: "Travel", slug: "travel", count: 4 },
  { id: "c4", name: "Sport", slug: "sport", count: 5 },
  { id: "c5", name: "Ultra-Thin", slug: "ultra-thin", count: 3 },
  { id: "c6", name: "Limited Editions", slug: "limited-editions", count: 6 },
];

/* =================================================================
   PRODUCTS — expanded from the original 12, now with seller data,
   INR pricing, stock, and reviews.
   ================================================================= */

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Rajat M.",
    rating: 5,
    date: "March 2025",
    title: "Worth every rupee",
    body: "The finishing is extraordinary. The beveled edges catch light in a way photos cannot capture. BAY's atelier handled the sizing perfectly.",
    verified: true,
  },
  {
    id: "r2",
    author: "Priya S.",
    rating: 5,
    date: "February 2025",
    title: "A true heirloom",
    body: "Bought this as a gift for my father's retirement. The presentation, the certificate, the hand-written note from the watchmaker — it felt like acquiring a piece of art, not a product.",
    verified: true,
  },
  {
    id: "r3",
    author: "Vikram J.",
    rating: 4,
    date: "January 2025",
    title: "Exceptional, with one note",
    body: "The movement is superb. The only minor critique: the crown is slightly stiff when winding. BAY's servicing team adjusted it within 48 hours.",
    verified: true,
  },
];

export const PRODUCTS: MarketplaceProduct[] = [
  {
    id: "p1",
    slug: "meridian-platinum",
    ref: "BAY-01",
    name: "Meridian",
    sellerId: "bay-maison",
    family: "Flagship",
    categoryId: "c1",
    tagline: "The dress watch, distilled.",
    description: "Meridian is the purest expression of BAY. A time-only dress watch in brushed platinum, its dial is a study in restraint — applied indices, sword hands, and a small seconds at six.",
    fullDescription: "Meridian is the purest expression of BAY. A time-only dress watch in brushed platinum, its dial is a study in restraint — applied indices, sword hands, and a small seconds at six. Nothing more than what is essential. Everything in its right place. The case is machined from a single billet of 950 platinum and finished by hand across forty-seven distinct operations. The movement — BAY Cal. 101 — is assembled by a single watchmaker and tested across six positions for fourteen days before casing.",
    complication: "Hours, minutes, small seconds",
    movement: "BAY Cal. 101 — manual wind, 21,600 vph",
    caseMaterial: "950 Platinum",
    caseDiameter: "38.5 mm",
    waterResistance: "30 m",
    powerReserve: "72 hours",
    production: "Series",
    priceInr: 1250000,
    mrpInr: 1350000,
    stock: 3,
    status: "low_stock",
    year: 2024,
    dialColor: "#0F1014",
    caseFinish: "polished-platinum",
    complicationType: "time-only",
    featured: true,
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 3,
    reviews: SAMPLE_REVIEWS.slice(0, 2),
  },
  {
    id: "p2",
    slug: "eclipse-tourbillon",
    ref: "BAY-02",
    name: "Eclipse",
    sellerId: "bay-maison",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "A flying tourbillon, veiled in shadow.",
    description: "Eclipse places a flying tourbillon at six o'clock, framed by a skeletonised bridge in obsidian-treated titanium. Fifty pieces, each numbered and signed by the master watchmaker.",
    fullDescription: "Eclipse places a flying tourbillon at six o'clock, framed by a skeletonised bridge in obsidian-treated titanium. The dial is hand-engraved with a topographic motif visible only under raking light. Fifty pieces, each numbered and signed by the master watchmaker. The case is Grade 5 titanium with an obsidian DLC coating, chosen for its weight-to-strength ratio and its acoustic neutrality — the tourbillon's quiet rotation is audible only to its wearer.",
    complication: "Flying tourbillon, hours, minutes",
    movement: "BAY Cal. 202 — manual wind, 21,600 vph",
    caseMaterial: "Grade 5 titanium, obsidian DLC",
    caseDiameter: "41 mm",
    waterResistance: "30 m",
    powerReserve: "96 hours",
    production: "Limited 50",
    priceInr: 18500000,
    stock: 1,
    status: "low_stock",
    year: 2024,
    dialColor: "#08090B",
    caseFinish: "sandblasted-titanium",
    complicationType: "tourbillon",
    limited: true,
    featured: true,
    warrantyMonths: 72,
    shippingInr: 0,
    shipsInDays: 7,
    reviews: SAMPLE_REVIEWS.slice(0, 1),
  },
  {
    id: "p3",
    slug: "aurora-gmt",
    ref: "BAY-03",
    name: "Aurora",
    sellerId: "bay-maison",
    family: "Travel",
    categoryId: "c3",
    tagline: "Twenty-four cities, one glance.",
    description: "Aurora is the traveler's companion — a true GMT with a 24-hour worldtimer ring and a day/night indicator rendered in lapis-tinted mother-of-pearl.",
    fullDescription: "Aurora is the traveler's companion — a true GMT with a 24-hour worldtimer ring and a day/night indicator rendered in lapis-tinted mother-of-pearl. Brushed steel case, integrated bracelet, and a bidirectional bezel in ceramic. The worldtimer is set via the crown — no pushers, no complications of operation. Twenty-four cities, one glance.",
    complication: "GMT, world timer, day/night",
    movement: "BAY Cal. 303 — automatic, 28,800 vph",
    caseMaterial: "904L steel",
    caseDiameter: "40 mm",
    waterResistance: "100 m",
    powerReserve: "70 hours",
    production: "Series",
    priceInr: 1850000,
    stock: 7,
    status: "active",
    year: 2025,
    dialColor: "#14161B",
    caseFinish: "brushed-steel",
    complicationType: "gmt",
    featured: true,
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 3,
    reviews: SAMPLE_REVIEWS.slice(1, 3),
  },
  {
    id: "p4",
    slug: "vertex-chronograph",
    ref: "BAY-04",
    name: "Vertex",
    sellerId: "bay-maison",
    family: "Sport",
    categoryId: "c4",
    tagline: "An instrument, not an accessory.",
    description: "Vertex is a column-wheel chronograph with a flyback function and a tachymeter engraved directly into the bezel.",
    fullDescription: "Vertex is a column-wheel chronograph with a flyback function and a tachymeter engraved directly into the bezel. The dial uses BAY's proprietary luminescent compound — visible for 14 hours in total darkness. Designed for pilots, worn by anyone who values precision under pressure. The forged carbon case is machined from a single billet and weighs only 42 grams.",
    complication: "Flyback chronograph, tachymeter",
    movement: "BAY Cal. 404 — automatic, 36,000 vph",
    caseMaterial: "Forged carbon, ceramic bezel",
    caseDiameter: "42 mm",
    waterResistance: "200 m",
    powerReserve: "60 hours",
    production: "Series",
    priceInr: 3500000,
    stock: 4,
    status: "active",
    year: 2025,
    dialColor: "#0F1014",
    caseFinish: "obsidian-ceramic",
    complicationType: "chronograph",
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 5,
    reviews: SAMPLE_REVIEWS.slice(0, 2),
  },
  {
    id: "p5",
    slug: "lumen-repeater",
    ref: "BAY-05",
    name: "Lumen",
    sellerId: "bay-maison",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "Time, made audible.",
    description: "Lumen is a minute repeater with a sapphire crystal gong and a fully visible striking mechanism. Twenty-five pieces.",
    fullDescription: "Lumen is a minute repeater with a sapphire crystal gong and a fully visible striking mechanism. The case is sandblasted platinum — chosen for its acoustic neutrality — and the dial is open-worked to allow the hammers to be seen in motion. Twenty-five pieces. The strike is activated via a slide on the case side; the sound is calibrated to a specific harmonic that BAY's master watchmakers tune by hand for each piece.",
    complication: "Minute repeater, hours, minutes",
    movement: "BAY Cal. 505 — manual wind, 21,600 vph",
    caseMaterial: "950 Platinum, sandblasted",
    caseDiameter: "40 mm",
    waterResistance: "30 m",
    powerReserve: "80 hours",
    production: "Limited 25",
    priceInr: 39500000,
    stock: 0,
    status: "preorder",
    year: 2024,
    dialColor: "#1B1E25",
    caseFinish: "polished-platinum",
    complicationType: "minute-repeater",
    limited: true,
    featured: true,
    warrantyMonths: 84,
    shippingInr: 0,
    shipsInDays: 30,
    reviews: [],
  },
  {
    id: "p6",
    slug: "tide-diver",
    ref: "BAY-06",
    name: "Tide",
    sellerId: "bay-maison",
    family: "Sport",
    categoryId: "c4",
    tagline: "Three hundred meters, no compromise.",
    description: "Tide is BAY's diver — a 300-meter instrument with a helium escape valve and a unidirectional ceramic bezel.",
    fullDescription: "Tide is BAY's diver — a 300-meter instrument with a helium escape valve, a unidirectional ceramic bezel, and a dial treated with seven layers of luminous pigment. The case is machined from a single billet of 904L steel, then brushed by hand. Tested to 375 meters in BAY's pressure chamber before casing.",
    complication: "Hours, minutes, seconds, date, dive bezel",
    movement: "BAY Cal. 606 — automatic, 28,800 vph",
    caseMaterial: "904L steel, ceramic bezel",
    caseDiameter: "42 mm",
    waterResistance: "300 m",
    powerReserve: "65 hours",
    production: "Series",
    priceInr: 850000,
    stock: 12,
    status: "active",
    year: 2025,
    dialColor: "#0C0D10",
    caseFinish: "brushed-steel",
    complicationType: "diver",
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 3,
    reviews: SAMPLE_REVIEWS.slice(0, 3),
  },
  {
    id: "p7",
    slug: "solstice-perpetual",
    ref: "BAY-07",
    name: "Solstice",
    sellerId: "bay-maison",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "A calendar that remembers the future.",
    description: "Solstice is a perpetual calendar that accounts for leap years and the 400-year Gregorian cycle without correction.",
    fullDescription: "Solstice is a perpetual calendar that accounts for leap years and the 400-year Gregorian cycle without correction. Day, date, month, and leap year are displayed in four sub-dials arranged around a moonphase at six. The dial is hand-lacquered in five successive layers.",
    complication: "Perpetual calendar, moonphase",
    movement: "BAY Cal. 707 — automatic, 28,800 vph",
    caseMaterial: "18k white gold",
    caseDiameter: "40 mm",
    waterResistance: "30 m",
    powerReserve: "72 hours",
    production: "Series",
    priceInr: 12500000,
    stock: 2,
    status: "low_stock",
    year: 2024,
    dialColor: "#14161B",
    caseFinish: "polished-platinum",
    complicationType: "perpetual-calendar",
    featured: true,
    warrantyMonths: 72,
    shippingInr: 0,
    shipsInDays: 7,
    reviews: SAMPLE_REVIEWS.slice(1, 3),
  },
  {
    id: "p8",
    slug: "horlogerie-geneve-celeste",
    ref: "HG-01",
    name: "Céleste",
    sellerId: "horlogerie-geneve",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "A sidereal complication, from Geneva.",
    description: "Céleste tracks sidereal time alongside solar time, displaying the difference between the two on a retrograde indicator at six.",
    fullDescription: "Céleste tracks sidereal time alongside solar time, displaying the difference between the two on a retrograde indicator at six. Brought to BAY by Horlogerie Genève, an authorized dealer since 1958. The dial is grand feu enamel with hand-painted star indices.",
    complication: "Sidereal time, retrograde indicator",
    movement: "HG Cal. 12 — automatic, 28,800 vph",
    caseMaterial: "18k white gold",
    caseDiameter: "41 mm",
    waterResistance: "30 m",
    powerReserve: "65 hours",
    production: "Series",
    priceInr: 6500000,
    stock: 5,
    status: "active",
    year: 2025,
    dialColor: "#14161B",
    caseFinish: "polished-platinum",
    complicationType: "astrological",
    warrantyMonths: 48,
    shippingInr: 0,
    shipsInDays: 5,
    reviews: SAMPLE_REVIEWS.slice(0, 2),
  },
  {
    id: "p9",
    slug: "nakshatra-astral",
    ref: "NAK-01",
    name: "Astral",
    sellerId: "nakshatra-watches",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "The sky over Mumbai, on your wrist.",
    description: "Astral displays the position of the sun, moon, and five visible planets relative to the wearer's location, calculated for the Indian subcontinent.",
    fullDescription: "Astral displays the position of the sun, moon, and five visible planets relative to the wearer's location, calculated for the Indian subcontinent. Hand-painted celestial enamel dial signed by the Mumbai-based artist. Each piece is calibrated to the buyer's birthplace coordinates.",
    complication: "Astrological chart, sidereal time",
    movement: "NAK Cal. 1 — automatic, 18,000 vph",
    caseMaterial: "18k white gold, sapphire bezel",
    caseDiameter: "43 mm",
    waterResistance: "30 m",
    powerReserve: "96 hours",
    production: "Limited 15",
    priceInr: 48500000,
    stock: 1,
    status: "low_stock",
    year: 2025,
    dialColor: "#14161B",
    caseFinish: "polished-platinum",
    complicationType: "astrological",
    limited: true,
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 14,
    reviews: SAMPLE_REVIEWS.slice(0, 1),
  },
  {
    id: "p10",
    slug: "titan-craft-skeleton",
    ref: "TC-01",
    name: "Veil",
    sellerId: "titan-craft",
    family: "Grand Complications",
    categoryId: "c2",
    tagline: "A skeleton, suspended in air.",
    description: "Veil is a skeletonised movement in which every bridge has been open-worked to the limit of structural integrity.",
    fullDescription: "Veil is a skeletonised movement in which every bridge has been open-worked to the limit of structural integrity. The movement appears to float inside the case, suspended on three titanium pillars. Each bridge is hand-beveled — a process that takes the Bengaluru workshop's master engraver 92 hours per piece.",
    complication: "Skeleton flying tourbillon",
    movement: "TC Cal. 9 — manual wind, 21,600 vph",
    caseMaterial: "Platinum and titanium",
    caseDiameter: "41 mm",
    waterResistance: "30 m",
    powerReserve: "120 hours",
    production: "Limited 30",
    priceInr: 27500000,
    stock: 2,
    status: "active",
    year: 2025,
    dialColor: "#08090B",
    caseFinish: "polished-platinum",
    complicationType: "skeleton",
    limited: true,
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 10,
    reviews: SAMPLE_REVIEWS.slice(0, 2),
  },
  {
    id: "p11",
    slug: "meridian-delhi-ultrathin",
    ref: "MD-01",
    name: "Whisper",
    sellerId: "meridian-delhi",
    family: "Ultra-Thin",
    categoryId: "c5",
    tagline: "Two point four millimeters.",
    description: "Whisper is a 2.4mm movement housed in a 5.8mm case — the thinnest in BAY's marketplace.",
    fullDescription: "Whisper is a 2.4mm movement housed in a 5.8mm case — the thinnest in BAY's marketplace. No complication, no decoration, no compromise. The dial is a single sheet of brushed ruthenium, with applied indices so fine they must be set under a microscope. From Meridian Delhi, an authorized BAY dealer since 2001.",
    complication: "Hours, minutes",
    movement: "MD Cal. 2 — manual wind, 21,600 vph",
    caseMaterial: "Sandblasted titanium",
    caseDiameter: "39 mm",
    waterResistance: "30 m",
    powerReserve: "48 hours",
    production: "Series",
    priceInr: 4200000,
    stock: 6,
    status: "active",
    year: 2025,
    dialColor: "#1B1E25",
    caseFinish: "sandblasted-titanium",
    complicationType: "ultra-thin",
    warrantyMonths: 48,
    shippingInr: 0,
    shipsInDays: 4,
    reviews: SAMPLE_REVIEWS.slice(1, 3),
  },
  {
    id: "p12",
    slug: "abyss-marine-deep",
    ref: "AB-01",
    name: "Deep",
    sellerId: "abyss-marine",
    family: "Sport",
    categoryId: "c4",
    tagline: "Five hundred meters, tested in the Arabian Sea.",
    description: "Deep is a 500-meter diver tested in the Arabian Sea before it ships. From Abyss Marine, Goa.",
    fullDescription: "Deep is a 500-meter diver tested in the Arabian Sea before it ships. From Abyss Marine, Goa. The case is forged from a single billet of 904L steel, with a helium escape valve at 9 o'clock and a unidirectional ceramic bezel. Each piece is depth-tested to 625 meters in Abyss's Goa facility.",
    complication: "Hours, minutes, seconds, date, dive bezel",
    movement: "AB Cal. 5 — automatic, 28,800 vph",
    caseMaterial: "904L steel, ceramic bezel",
    caseDiameter: "44 mm",
    waterResistance: "500 m",
    powerReserve: "70 hours",
    production: "Series",
    priceInr: 1550000,
    stock: 8,
    status: "active",
    year: 2025,
    dialColor: "#0C0D10",
    caseFinish: "brushed-steel",
    complicationType: "diver",
    warrantyMonths: 60,
    shippingInr: 0,
    shipsInDays: 5,
    reviews: SAMPLE_REVIEWS.slice(0, 2),
  },
];

/* =================================================================
   Helper functions
   ================================================================= */

export function getProductBySlug(slug: string): MarketplaceProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getSellerById(id: string): Seller | undefined {
  return SELLERS.find((s) => s.id === id);
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getProductsBySeller(sellerId: string): MarketplaceProduct[] {
  return PRODUCTS.filter((p) => p.sellerId === sellerId);
}

export function getFeaturedProducts(): MarketplaceProduct[] {
  return PRODUCTS.filter((p) => p.featured);
}

/**
 * Format a price in INR paise to a display string.
 * BAY uses lakh/crore notation for prices above ₹1 lakh.
 */
export function formatInr(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    // Crore
    const crore = rupees / 10000000;
    return `₹${crore.toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    // Lakh
    const lakh = rupees / 100000;
    return `₹${lakh.toFixed(2)} L`;
  }
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/** Full INR formatting (no lakh/crore) — for checkout transparency */
export function formatInrFull(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/**
 * GST calculation — 18% on watches, inclusive in displayed price.
 * Returns the GST component for itemized checkout display.
 */
export function calculateGST(pricePaise: number): {
  base: number;
  gst: number;
  total: number;
} {
  // Price is GST-inclusive. Base = price / 1.18, GST = price - base.
  const base = Math.round(pricePaise / 1.18);
  const gst = pricePaise - base;
  return { base, gst, total: pricePaise };
}

/**
 * TCS calculation — 1% on marketplace sales, collected by BAY.
 * Applied at checkout, remitted to government by BAY.
 */
export function calculateTCS(pricePaise: number): number {
  return Math.round(pricePaise * 0.01);
}

/* =================================================================
   Legacy data — kept for the marketing site (page.tsx)
   These map to the marketplace products above so the marketing site
   can link into /shop without duplication.
   ================================================================= */

export type WatchCollection = {
  id: string;
  ref: string;
  name: string;
  family: string;
  tagline: string;
  description: string;
  complication: string;
  movement: string;
  caseMaterial: string;
  caseDiameter: string;
  waterResistance: string;
  powerReserve: string;
  production: string;
  price: string;
  year: number;
  dialColor: string;
  caseFinish: "polished-platinum" | "brushed-steel" | "sandblasted-titanium" | "obsidian-ceramic";
  complicationType:
    | "time-only" | "tourbillon" | "perpetual-calendar" | "minute-repeater"
    | "gmt" | "chronograph" | "diver" | "ultra-thin" | "skeleton"
    | "grand-sonnerie" | "astrological" | "grand-complication";
  limited?: boolean;
  featured?: boolean;
  /** Marketplace slug — links the marketing card to the product page */
  shopSlug?: string;
};

export const WATCHES: WatchCollection[] = [
  { id: "meridian", ref: "BAY-01", name: "Meridian", family: "Flagship", tagline: "The dress watch, distilled.", description: "Meridian is the purest expression of BAY. A time-only dress watch in brushed platinum, its dial is a study in restraint — applied indices, sword hands, and a small seconds at six. Nothing more than what is essential. Everything in its right place.", complication: "Hours, minutes, small seconds", movement: "BAY Cal. 101 — manual wind, 21,600 vph", caseMaterial: "950 Platinum", caseDiameter: "38.5 mm", waterResistance: "30 m", powerReserve: "72 hours", production: "Series", price: "₹12,500", year: 2024, dialColor: "#0F1014", caseFinish: "polished-platinum", complicationType: "time-only", featured: true, shopSlug: "meridian-platinum" },
  { id: "eclipse", ref: "BAY-02", name: "Eclipse", family: "Grand Complications", tagline: "A flying tourbillon, veiled in shadow.", description: "Eclipse places a flying tourbillon at six o'clock, framed by a skeletonised bridge in obsidian-treated titanium. The dial is hand-engraved with a topographic motif visible only under raking light. Fifty pieces, each numbered and signed by the master watchmaker.", complication: "Flying tourbillon, hours, minutes", movement: "BAY Cal. 202 — manual wind, 21,600 vph", caseMaterial: "Grade 5 titanium, obsidian DLC", caseDiameter: "41 mm", waterResistance: "30 m", powerReserve: "96 hours", production: "Limited 50", price: "₹1.85 L", year: 2024, dialColor: "#08090B", caseFinish: "sandblasted-titanium", complicationType: "tourbillon", limited: true, featured: true, shopSlug: "eclipse-tourbillon" },
  { id: "aurora", ref: "BAY-03", name: "Aurora", family: "Travel", tagline: "Twenty-four cities, one glance.", description: "Aurora is the traveler's companion — a true GMT with a 24-hour worldtimer ring and a day/night indicator rendered in lapis-tinted mother-of-pearl. Brushed steel case, integrated bracelet, and a bidirectional bezel in ceramic.", complication: "GMT, world timer, day/night", movement: "BAY Cal. 303 — automatic, 28,800 vph", caseMaterial: "904L steel", caseDiameter: "40 mm", waterResistance: "100 m", powerReserve: "70 hours", production: "Series", price: "₹18,500", year: 2025, dialColor: "#14161B", caseFinish: "brushed-steel", complicationType: "gmt", featured: true, shopSlug: "aurora-gmt" },
  { id: "vertex", ref: "BAY-04", name: "Vertex", family: "Sport", tagline: "An instrument, not an accessory.", description: "Vertex is a column-wheel chronograph with a flyback function and a tachymeter engraved directly into the bezel. The dial uses BAY's proprietary luminescent compound — visible for 14 hours in total darkness.", complication: "Flyback chronograph, tachymeter", movement: "BAY Cal. 404 — automatic, 36,000 vph", caseMaterial: "Forged carbon, ceramic bezel", caseDiameter: "42 mm", waterResistance: "200 m", powerReserve: "60 hours", production: "Series", price: "₹35,000", year: 2025, dialColor: "#0F1014", caseFinish: "obsidian-ceramic", complicationType: "chronograph", shopSlug: "vertex-chronograph" },
  { id: "lumen", ref: "BAY-05", name: "Lumen", family: "Grand Complications", tagline: "Time, made audible.", description: "Lumen is a minute repeater with a sapphire crystal gong and a fully visible striking mechanism. The case is sandblasted platinum — chosen for its acoustic neutrality — and the dial is open-worked to allow the hammers to be seen in motion. Twenty-five pieces.", complication: "Minute repeater, hours, minutes", movement: "BAY Cal. 505 — manual wind, 21,600 vph", caseMaterial: "950 Platinum, sandblasted", caseDiameter: "40 mm", waterResistance: "30 m", powerReserve: "80 hours", production: "Limited 25", price: "₹3.95 L", year: 2024, dialColor: "#1B1E25", caseFinish: "polished-platinum", complicationType: "minute-repeater", limited: true, featured: true, shopSlug: "lumen-repeater" },
  { id: "tide", ref: "BAY-06", name: "Tide", family: "Sport", tagline: "Three hundred meters, no compromise.", description: "Tide is BAY's diver — a 300-meter instrument with a helium escape valve, a unidirectional ceramic bezel, and a dial treated with seven layers of luminous pigment. The case is machined from a single billet of 904L steel, then brushed by hand.", complication: "Hours, minutes, seconds, date, dive bezel", movement: "BAY Cal. 606 — automatic, 28,800 vph", caseMaterial: "904L steel, ceramic bezel", caseDiameter: "42 mm", waterResistance: "300 m", powerReserve: "65 hours", production: "Series", price: "₹8,500", year: 2025, dialColor: "#0C0D10", caseFinish: "brushed-steel", complicationType: "diver", shopSlug: "tide-diver" },
  { id: "solstice", ref: "BAY-07", name: "Solstice", family: "Grand Complications", tagline: "A calendar that remembers the future.", description: "Solstice is a perpetual calendar that accounts for leap years and the 400-year Gregorian cycle without correction. Day, date, month, and leap year are displayed in four sub-dials arranged around a moonphase at six. The dial is hand-lacquered in five successive layers.", complication: "Perpetual calendar, moonphase", movement: "BAY Cal. 707 — automatic, 28,800 vph", caseMaterial: "18k white gold", caseDiameter: "40 mm", waterResistance: "30 m", powerReserve: "72 hours", production: "Series", price: "₹1.25 L", year: 2024, dialColor: "#14161B", caseFinish: "polished-platinum", complicationType: "perpetual-calendar", featured: true, shopSlug: "solstice-perpetual" },
  { id: "horizon", ref: "BAY-08", name: "Horizon", family: "Ultra-Thin", tagline: "Two point eight millimeters.", description: "Horizon is BAY's ultra-thin expression — a 2.8mm movement housed in a 6.4mm case. No complication, no decoration, no compromise. The dial is a single sheet of brushed ruthenium, with applied indices so fine they must be set under a microscope.", complication: "Hours, minutes", movement: "BAY Cal. 808 — manual wind, 21,600 vph", caseMaterial: "Sandblasted titanium", caseDiameter: "39 mm", waterResistance: "30 m", powerReserve: "48 hours", production: "Series", price: "₹28,500", year: 2025, dialColor: "#1B1E25", caseFinish: "sandblasted-titanium", complicationType: "ultra-thin" },
  { id: "nimbus", ref: "BAY-09", name: "Nimbus", family: "Grand Complications", tagline: "A skeleton, suspended in air.", description: "Nimbus is a skeletonised flying tourbillon in which every bridge has been open-worked to the limit of structural integrity. The movement appears to float inside the case, suspended on three titanium pillars. The caseback is sapphire, front and back.", complication: "Skeleton flying tourbillon", movement: "BAY Cal. 909 — manual wind, 21,600 vph", caseMaterial: "Platinum and titanium", caseDiameter: "41 mm", waterResistance: "30 m", powerReserve: "120 hours", production: "Limited 30", price: "₹2.95 L", year: 2025, dialColor: "#08090B", caseFinish: "polished-platinum", complicationType: "skeleton", limited: true },
  { id: "atlas", ref: "BAY-10", name: "Atlas", family: "Grand Complications", tagline: "The grande sonnerie, reborn.", description: "Atlas is BAY's grande sonnerie — striking the hours and quarters in passing, with a petite sonnerie and silent mode selectable via the crown. The movement contains 942 components, assembled by a single master watchmaker over eleven months. Ten pieces.", complication: "Grande sonnerie, minute repeater, silence", movement: "BAY Cal. 1010 — manual wind, 21,600 vph", caseMaterial: "950 Platinum", caseDiameter: "42 mm", waterResistance: "30 m", powerReserve: "72 hours", production: "Limited 10", price: "₹8.75 L", year: 2024, dialColor: "#0F1014", caseFinish: "polished-platinum", complicationType: "grand-sonnerie", limited: true, featured: true },
  { id: "polaris", ref: "BAY-11", name: "Polaris", family: "Grand Complications", tagline: "The sky, on your wrist.", description: "Polaris is an astrological complication — displaying the position of the sun, moon, and five visible planets relative to the wearer's location, calculated through the year 2200. The dial is hand-painted celestial enamel, signed by the artist.", complication: "Astrological chart, sidereal time", movement: "BAY Cal. 1111 — automatic, 18,000 vph", caseMaterial: "18k white gold, sapphire bezel", caseDiameter: "43 mm", waterResistance: "30 m", powerReserve: "96 hours", production: "Limited 15", price: "₹5.50 L", year: 2025, dialColor: "#14161B", caseFinish: "polished-platinum", complicationType: "astrological", limited: true },
  { id: "zenith", ref: "BAY-12", name: "Zenith", family: "Grand Complications", tagline: "Five complications. One movement.", description: "Zenith is BAY's grand complication — a minute repeater, perpetual calendar, flying tourbillon, sidereal time, and equation of time, integrated into a single movement of 1,124 components. Five pieces, each commissioned and customized to the owner.", complication: "Grand complication — five functions", movement: "BAY Cal. 1212 — manual wind, 21,600 vph", caseMaterial: "950 Platinum", caseDiameter: "43 mm", waterResistance: "30 m", powerReserve: "120 hours", production: "Limited 5", price: "₹12.50 L", year: 2024, dialColor: "#08090B", caseFinish: "polished-platinum", complicationType: "grand-complication", limited: true, featured: true },
];

export const HERITAGE_TIMELINE = [
  { year: "1947", title: "The Atelier Opens", body: "Founded in a converted granary in Le Crêt-du-Locle, BAY begins as a single-bench workshop producing ebauche movements for neighbouring maisons." },
  { year: "1962", title: "First In-House Caliber", body: "BAY Cal. 01 — the maison's first entirely in-house movement — is submitted to the Geneva Observatory chronometer trials and places second in its class." },
  { year: "1978", title: "The Quartz Refusal", body: "While the industry pivots to quartz, BAY's then-director declines all electronic production and commits the maison exclusively to mechanical watchmaking." },
  { year: "1994", title: "The Tourbillon Revival", body: "BAY releases Eclipse — among the first flying tourbillons of the modern era — predating the broader revival by nearly a decade." },
  { year: "2011", title: "The Grand Complication Wing", body: "A dedicated atelier for grand complications is opened, staffed by seven master watchmakers, each of whom assembles a single watch from beginning to end." },
  { year: "2024", title: "Atlas, and Beyond", body: "BAY presents Atlas — the maison's first grande sonnerie — and Zenith, a five-complication grand piece, signalling a new chapter in quiet ambition." },
];

export const CRAFT_PILLARS = [
  { num: "01", title: "Movement", headline: "Calibers drawn, cut, and assembled in-house.", body: "Every BAY movement is conceived, drawn, prototyped, and assembled within the maison. Components are cut by wire EDM from raw brass, hand-beveled across 72 angles, and tested across six positions for fourteen days before they are cased.", stat: "942", statLabel: "components in Atlas" },
  { num: "02", title: "Case", headline: "Machined from billet, finished by hand.", body: "Each case begins as a single billet of platinum, titanium, or steel. After CNC roughing, every surface is finished by hand across forty-seven distinct operations. A single case requires nine hours of handwork.", stat: "47", statLabel: "finishing operations" },
  { num: "03", title: "Dial", headline: "Lacquer, enamel, and metal, layered.", body: "BAY dials are produced in five formats: lacquer, grand feu enamel, brushed ruthenium, hand-engraved skeleton, and celestial enamel. Indices are applied by hand under a 10x microscope.", stat: "6", statLabel: "enamel firings" },
  { num: "04", title: "Assembly", headline: "One watchmaker. One watch. Beginning to end.", body: "In the grand complication atelier, a single master watchmaker assembles each piece from beginning to end — a process that takes between four and eleven months. The watchmaker's initial is engraved on the movement.", stat: "11", statLabel: "months for Atlas" },
];

export const JOURNAL_ENTRIES = [
  { id: "j1", category: "Craft", date: "May 2025", title: "Why we still hand-bevel 72 angles on every movement", excerpt: "A beveled edge catches light in a way no machine can replicate. It is the difference between a movement that has been manufactured and one that has been made.", readTime: "8 min" },
  { id: "j2", category: "Heritage", date: "April 2025", title: "The Quartz Refusal of 1978, and what it cost us", excerpt: "When the industry pivoted to quartz, BAY chose mechanics. We lost three decades of growth. We gained something rarer — a craft that survived.", readTime: "12 min" },
  { id: "j3", category: "Engineering", date: "March 2025", title: "Designing the grande sonnerie: nine months with the master", excerpt: "We spent nine months inside the atelier with the watchmaker behind Atlas. Here is what it takes to make a watch strike the hours, in passing, for a lifetime.", readTime: "15 min" },
  { id: "j4", category: "Collectors", date: "February 2025", title: "Inside the private commission of Zenith No. 03", excerpt: "One of five Zenith grand complications was commissioned with a sidereal complication tuned to the owner's birthplace. We are allowed to show you the dial.", readTime: "10 min" },
];

export const BOUTIQUES = [
  { city: "Mumbai", address: "The Oberoi, Nariman Point", country: "India", hours: "Mon–Sat, 10:00–19:00", appointment: true },
  { city: "New Delhi", address: "The Lodhi, Lodhi Road", country: "India", hours: "Mon–Sat, 10:00–19:00", appointment: true },
  { city: "Bengaluru", address: "The Leela Palace, Old Airport Road", country: "India", hours: "Mon–Sat, 10:00–19:00", appointment: true },
  { city: "Geneva", address: "1, Rue du Rhône", country: "Switzerland", hours: "Mon–Sat, 10:00–19:00", appointment: true },
  { city: "Tokyo", address: "Ginza Six, 6th Floor", country: "Japan", hours: "Daily, 11:00–20:00", appointment: true },
  { city: "Dubai", address: "DIFC, Gate Village 02", country: "U.A.E.", hours: "Sun–Thu, 10:00–20:00", appointment: true },
];

export const NAV_LINKS = [
  { label: "Maison", href: "/#top" },
  { label: "Collections", href: "/#collections" },
  { label: "Movements", href: "/#movements" },
  { label: "Shop", href: "/shop" },
  { label: "Journal", href: "/#journal" },
];

export const MARQUEE_WORDS = [
  "Quiet Luxury", "Timeless Precision", "Swiss-Inspired", "Mechanical Excellence",
  "Hand-Finished", "In-House Calibers", "Limited Editions", "Grand Complications",
];
