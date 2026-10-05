// Simple postcode-prefix allowlist around the Canterbury, Kent (CT1 1DX) address —
// no geocoding API required. Expand this list (or swap for a radius/postcode-lookup
// service) as the real delivery area is defined.
const ALLOWED_POSTCODE_PREFIXES = ["CT"];

export function isAddressInDeliveryZone(address: string): boolean {
  const normalized = address.toUpperCase();
  // Word-boundary match so a prefix doesn't also match inside an unrelated word.
  return ALLOWED_POSTCODE_PREFIXES.some((prefix) => new RegExp(`\\b${prefix}\\d`).test(normalized));
}

export const DELIVERY_ZONE_DESCRIPTION = "Canterbury and the surrounding Kent area (CT postcodes)";
