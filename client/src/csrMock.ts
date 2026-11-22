// Mock data for the CSR sponsorship dashboard. Not real company figures.

export type SponsorshipType = "Delivery" | "Food Rescue Campaign";

export type Sponsor = {
  id: string;
  company: string;
  sector: string;
  pledgedUsd: number;
  deliveriesSponsored: number;
  campaignsSponsored: number;
  mealsSponsored: number;
  ngosSupported: number;
  kgRescued: number;
  sponsorships: Array<{ type: SponsorshipType; label: string; meals: number }>;
};

export const SPONSORS: Sponsor[] = [
  {
    id: "sp-hcl",
    company: "HCL Tech",
    sector: "IT services",
    pledgedUsd: 120000,
    deliveriesSponsored: 210,
    campaignsSponsored: 4,
    mealsSponsored: 42000,
    ngosSupported: 9,
    kgRescued: 21000,
    sponsorships: [
      { type: "Delivery", label: "Weekend pickup drive, Bengaluru", meals: 12000 },
      { type: "Food Rescue Campaign", label: "Winter Warmth Campaign", meals: 30000 },
    ],
  },
  {
    id: "sp-infosys",
    company: "Infosys",
    sector: "Technology consulting",
    pledgedUsd: 95000,
    deliveriesSponsored: 168,
    campaignsSponsored: 3,
    mealsSponsored: 33500,
    ngosSupported: 7,
    kgRescued: 16750,
    sponsorships: [
      { type: "Delivery", label: "Campus pickup network", meals: 9500 },
      { type: "Food Rescue Campaign", label: "Hunger Free Mysuru Drive", meals: 24000 },
    ],
  },
  {
    id: "sp-microsoft",
    company: "Codebenders",
    sector: "Software",
    pledgedUsd: 150000,
    deliveriesSponsored: 260,
    campaignsSponsored: 5,
    mealsSponsored: 56000,
    ngosSupported: 12,
    kgRescued: 28000,
    sponsorships: [
      { type: "Delivery", label: "Cloud-tracked delivery fleet", meals: 21000 },
      { type: "Food Rescue Campaign", label: "Community Kitchen Expansion", meals: 35000 },
    ],
  },
];

// Sums impact figures across sponsors.
// "ngos" is a simple sum of ngosSupported per sponsor and may double count NGOs
// that are supported by more than one sponsor.
export function totals(sponsors: Sponsor[]): { meals: number; ngos: number; kg: number; sponsors: number } {
  return {
    meals: sponsors.reduce((sum, s) => sum + s.mealsSponsored, 0),
    ngos: sponsors.reduce((sum, s) => sum + s.ngosSupported, 0),
    kg: sponsors.reduce((sum, s) => sum + s.kgRescued, 0),
    sponsors: sponsors.length,
  };
}

// 1 meal = 500 g
export function impactKgToMeals(kg: number): number {
  return Math.floor(kg / 0.5);
}
