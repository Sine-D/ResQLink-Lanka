import {
  estimateDistrictReach,
  DISTRICT_POPULATION_MAP,
  DEFAULT_FALLBACK_POPULATION,
} from "../../lib/utils/reachEstimator";

describe("UC1: Demographic Reach Estimator Comprehensive Test Suite", () => {
  describe("1. Baseline Constants & Immutability", () => {
    test("DEFAULT_FALLBACK_POPULATION is 150,000", () => {
      expect(DEFAULT_FALLBACK_POPULATION).toBe(150000);
    });

    test("DISTRICT_POPULATION_MAP contains exactly 25 administrative districts", () => {
      const keys = Object.keys(DISTRICT_POPULATION_MAP);
      expect(keys.length).toBe(25);
    });

    test("DISTRICT_POPULATION_MAP is frozen (immutable)", () => {
      expect(Object.isFrozen(DISTRICT_POPULATION_MAP)).toBe(true);
    });
  });

  describe("2. Individual District Population Accuracy (All 25 Districts)", () => {
    const EXPECTED_DISTRICTS: Record<string, number> = {
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
    };

    test.each(Object.entries(EXPECTED_DISTRICTS))(
      "correctly resolves population for %s -> %d",
      (district, expectedPopulation) => {
        expect(estimateDistrictReach(district)).toBe(expectedPopulation);
      }
    );
  });

  describe("3. Normalization & Case Insensitivity", () => {
    test("handles lowercase input (e.g. 'colombo' -> 750000)", () => {
      expect(estimateDistrictReach("colombo")).toBe(750000);
    });

    test("handles UPPERCASE input (e.g. 'GAMPAHA' -> 600000)", () => {
      expect(estimateDistrictReach("GAMPAHA")).toBe(600000);
    });

    test("handles MixedCase input (e.g. 'kAnDy' -> 400000)", () => {
      expect(estimateDistrictReach("kAnDy")).toBe(400000);
    });

    test("trims leading and trailing whitespace ('  Ratnapura   ' -> 280000)", () => {
      expect(estimateDistrictReach("  Ratnapura   ")).toBe(280000);
    });

    test("trims tabs and newlines correctly ('\\tGalle\\n' -> 300000)", () => {
      expect(estimateDistrictReach("\tGalle\n")).toBe(300000);
    });
  });

  describe("4. Edge Cases, Unknown Districts, and Fallbacks", () => {
    test("returns DEFAULT_FALLBACK_POPULATION for unknown district string", () => {
      expect(estimateDistrictReach("Atlantis")).toBe(DEFAULT_FALLBACK_POPULATION);
    });

    test("returns DEFAULT_FALLBACK_POPULATION for empty string ''", () => {
      expect(estimateDistrictReach("")).toBe(DEFAULT_FALLBACK_POPULATION);
    });

    test("returns DEFAULT_FALLBACK_POPULATION for whitespace-only string '   '", () => {
      expect(estimateDistrictReach("   ")).toBe(DEFAULT_FALLBACK_POPULATION);
    });

    test("returns DEFAULT_FALLBACK_POPULATION for null input", () => {
      expect(estimateDistrictReach(null as unknown as string)).toBe(DEFAULT_FALLBACK_POPULATION);
    });

    test("returns DEFAULT_FALLBACK_POPULATION for undefined input", () => {
      expect(estimateDistrictReach(undefined as unknown as string)).toBe(DEFAULT_FALLBACK_POPULATION);
    });

    test("returns DEFAULT_FALLBACK_POPULATION for numeric / non-string type input", () => {
      expect(estimateDistrictReach(12345 as unknown as string)).toBe(DEFAULT_FALLBACK_POPULATION);
    });
  });
});
