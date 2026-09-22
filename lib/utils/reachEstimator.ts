// Static population density lookup table for Sri Lanka districts
const DISTRICT_POPULATION_MAP: Record<string, number> = {
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

export function estimateDistrictReach(districtName: string): number {
  const normalized = districtName.trim();
  const foundKey = Object.keys(DISTRICT_POPULATION_MAP).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  if (foundKey) {
    return DISTRICT_POPULATION_MAP[foundKey];
  }
  return 150000; // Default fallback estimate
}
