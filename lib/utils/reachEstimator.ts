/**
 * @file reachEstimator.ts
 * @description Demographic Reach Calculation Utility for UC1: Disaster Early-Warning.
 * Maps administrative districts of Sri Lanka to census population estimates to forecast
 * affected citizen reach during geofenced early-warning broadcasts.
 *
 * @solid
 * - Single Responsibility Principle (SRP): Focuses exclusively on demographic census lookup.
 * - Open/Closed Principle (OCP): Population density map can be extended or replaced with
 *   dynamic census API lookups without altering client service calls.
 */

// ============================================================================
// CONSTANTS & DEMOGRAPHIC LOOKUP MAP
// ============================================================================

export const DEFAULT_FALLBACK_POPULATION = 150000;

/**
 * Population density estimates by administrative district (Sri Lanka Department of Census and Statistics).
 */
export const DISTRICT_POPULATION_MAP: Readonly<Record<string, number>> = Object.freeze({
  Colombo: 750000,
  Gampaha: 600000,
  Kalutara: 350000,
  Kandy: 400000,
  Galle: 300000,
  Matara: 250000,
  Ratnapura: 280000,
  Jaffna: 200000,
  Trincomalee: 180000,
  Batticaloa: 220000,
  Badulla: 190000,
  Kurunegala: 320000,
  NuwaraEliya: 210000,
  Anuradhapura: 230000,
  Polonnaruwa: 160000,
  Hambantota: 180000,
  Kegalle: 240000,
  Matale: 170000,
  Puttalam: 260000,
  Mannar: 90000,
  Vavuniya: 110000,
  Mullaitivu: 85000,
  Kilinochchi: 95000,
  Monaragala: 140000,
  Ampara: 210000,
});

/**
 * Estimates the impacted citizen population reach for an administrative district.
 * Performs case-insensitive matching and whitespace normalization.
 *
 * @param districtName - Name of the administrative district.
 * @returns Estimated citizen population reach count.
 */
export function estimateDistrictReach(districtName: string): number {
  if (!districtName || typeof districtName !== "string") {
    return DEFAULT_FALLBACK_POPULATION;
  }

  const normalized = districtName.trim().toLowerCase();
  const matchedEntry = Object.entries(DISTRICT_POPULATION_MAP).find(
    ([key]) => key.toLowerCase() === normalized
  );

  if (matchedEntry) {
    return matchedEntry[1];
  }

  return DEFAULT_FALLBACK_POPULATION;
}
