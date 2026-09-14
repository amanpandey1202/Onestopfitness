/**
 * Single source of truth for offer discount math.
 * Used by the checkout pages, the payment order API, and anywhere else
 * a price needs to reflect an offer. Keeping this in one place prevents
 * the UI and server from disagreeing on what the member actually pays.
 */

type Discountable = {
  discountType?: string | null; // "PERCENT" | "AMOUNT"
  discountValue?: number | null;
};

export function applyOfferDiscount(
  price: number,
  offer: Discountable | null | undefined
): { finalPrice: number; discountAmount: number } {
  if (!offer || price <= 0) return { finalPrice: price, discountAmount: 0 };
  if (offer.discountType === "PERCENT" && offer.discountValue) {
    const discountAmount = Math.round((price * offer.discountValue) / 100);
    return { finalPrice: Math.max(1, price - discountAmount), discountAmount };
  }
  if (offer.discountType === "AMOUNT" && offer.discountValue) {
    const discountAmount = Math.min(price - 1, offer.discountValue);
    return { finalPrice: Math.max(1, price - discountAmount), discountAmount };
  }
  return { finalPrice: price, discountAmount: 0 };
}