/**
 * Central brand + commercial constants for the /beta landing page.
 *
 * NOTE: "Clima Master" is a temporary working name. Change BRAND_NAME here and
 * it updates everywhere on the landing page (header, hero, footer, meta, pricing).
 */

export const BRAND_NAME = 'Clima Master';

/** Short descriptor used next to the logo / in trust copy. */
export const BRAND_KICKER = 'Liquid Glass Dashboard';

/** One-line positioning statement. */
export const BRAND_TAGLINE = 'La prima dashboard per Home Assistant con design Liquid Glass.';

/** Pro one-time purchase price (launch pricing). Kept as parts for easy i18n/formatting. */
export const PRO_PRICE = {
  currency: '€',
  amount: '19,99',
  /** Cadence label — one-time purchase, not a subscription. */
  cadence: 'una tantum',
  /** Honest framing: the native Pro app is on the roadmap, not shipping today. */
  availability: 'In arrivo',
} as const;

/** Anchor ids used by the header nav and in-page links. */
export const SECTION_IDS = {
  features: 'features',
  demo: 'demo',
  editions: 'editions',
  pricing: 'pricing',
  faq: 'faq',
} as const;
