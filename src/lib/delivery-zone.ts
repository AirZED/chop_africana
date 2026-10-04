// Simple postcode-prefix allowlist around the Whitechapel restaurant — no geocoding
// API required. Expand this list (or swap for a radius/postcode-lookup service) as
// the real delivery area is defined.
const ALLOWED_POSTCODE_PREFIXES = ["E1", "E2", "E3", "E14", "E7", "E8"];

export function isAddressInDeliveryZone(address: string): boolean {
  const normalized = address.toUpperCase();
  // Word-boundary match so "E1" doesn't also match inside "E14" (a different district) or
  // incidentally inside unrelated text.
  return ALLOWED_POSTCODE_PREFIXES.some((prefix) => new RegExp(`\\b${prefix}\\b`).test(normalized));
}

export const DELIVERY_ZONE_DESCRIPTION = "East London (E1, E2, E3, E7, E8, E14)";
