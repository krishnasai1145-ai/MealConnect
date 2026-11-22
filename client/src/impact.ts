// 1 meal = 500 g of food
export const MEAL_WEIGHT_KG = 0.5;

export type ImpactStatus = 'Available' | 'Claimed' | 'Completed';

export type ImpactDonation = {
  id: string;
  donor: string;
  ngo: string | null;
  category: string;
  quantityKg: number;
  date: string; // ISO yyyy-mm-dd
  status: ImpactStatus;
};

export interface ImpactSummary {
  totalDonations: number;
  foodSavedKg: number;
  mealsSaved: number;
  ngosSupported: number;
  monthly: { month: string; kg: number }[];
  byCategory: { category: string; kg: number }[];
  topNgos: { ngo: string; donations: number }[];
}

// Fixed sample data (Dec 2025 – May 2026). Never derived from the current date.
export const SAMPLE_DONATIONS: ImpactDonation[] = [
  { id: 'd01', donor: 'Green Kitchen', ngo: 'City Food Bank', category: 'Cooked meal', quantityKg: 12.5, date: '2025-12-03', status: 'Completed' },
  { id: 'd02', donor: 'Maple Bakery', ngo: 'Hope Shelter', category: 'Bakery', quantityKg: 6, date: '2025-12-09', status: 'Completed' },
  { id: 'd03', donor: 'Sunrise Cafe', ngo: 'Community Pantry', category: 'Cooked meal', quantityKg: 18, date: '2025-12-15', status: 'Completed' },
  { id: 'd04', donor: 'Harvest Farm', ngo: 'Youth Meals Trust', category: 'Fresh produce', quantityKg: 30, date: '2025-12-20', status: 'Completed' },
  { id: 'd05', donor: 'Corner Deli', ngo: 'City Food Bank', category: 'Packaged', quantityKg: 8.5, date: '2026-01-06', status: 'Completed' },
  { id: 'd06', donor: 'Green Kitchen', ngo: 'Hope Shelter', category: 'Cooked meal', quantityKg: 14, date: '2026-01-12', status: 'Completed' },
  { id: 'd07', donor: 'Maple Bakery', ngo: 'Community Pantry', category: 'Bakery', quantityKg: 4.5, date: '2026-01-19', status: 'Completed' },
  { id: 'd08', donor: 'Harvest Farm', ngo: 'City Food Bank', category: 'Fresh produce', quantityKg: 22, date: '2026-01-27', status: 'Completed' },
  { id: 'd09', donor: 'Sunrise Cafe', ngo: 'Youth Meals Trust', category: 'Dairy', quantityKg: 5, date: '2026-02-02', status: 'Completed' },
  { id: 'd10', donor: 'Corner Deli', ngo: 'Hope Shelter', category: 'Packaged', quantityKg: 10, date: '2026-02-10', status: 'Completed' },
  { id: 'd11', donor: 'Green Kitchen', ngo: 'City Food Bank', category: 'Cooked meal', quantityKg: 16, date: '2026-02-17', status: 'Completed' },
  { id: 'd12', donor: 'Maple Bakery', ngo: 'Youth Meals Trust', category: 'Bakery', quantityKg: 7, date: '2026-02-24', status: 'Completed' },
  { id: 'd13', donor: 'Harvest Farm', ngo: 'Community Pantry', category: 'Fresh produce', quantityKg: 26, date: '2026-03-03', status: 'Completed' },
  { id: 'd14', donor: 'Sunrise Cafe', ngo: 'City Food Bank', category: 'Dairy', quantityKg: 3.5, date: '2026-03-10', status: 'Completed' },
  { id: 'd15', donor: 'Corner Deli', ngo: 'Community Pantry', category: 'Packaged', quantityKg: 9, date: '2026-03-16', status: 'Completed' },
  { id: 'd16', donor: 'Green Kitchen', ngo: 'Youth Meals Trust', category: 'Cooked meal', quantityKg: 20, date: '2026-03-24', status: 'Completed' },
  { id: 'd17', donor: 'Maple Bakery', ngo: 'Hope Shelter', category: 'Bakery', quantityKg: 5.5, date: '2026-04-01', status: 'Completed' },
  { id: 'd18', donor: 'Harvest Farm', ngo: 'Hope Shelter', category: 'Fresh produce', quantityKg: 15, date: '2026-04-08', status: 'Completed' },
  { id: 'd19', donor: 'Sunrise Cafe', ngo: 'Community Pantry', category: 'Cooked meal', quantityKg: 11, date: '2026-04-14', status: 'Completed' },
  { id: 'd20', donor: 'Corner Deli', ngo: 'Youth Meals Trust', category: 'Packaged', quantityKg: 6.5, date: '2026-04-21', status: 'Completed' },
  { id: 'd21', donor: 'Green Kitchen', ngo: 'Community Pantry', category: 'Cooked meal', quantityKg: 13, date: '2026-05-05', status: 'Claimed' },
  { id: 'd22', donor: 'Harvest Farm', ngo: 'City Food Bank', category: 'Fresh produce', quantityKg: 24, date: '2026-05-12', status: 'Claimed' },
  { id: 'd23', donor: 'Maple Bakery', ngo: null, category: 'Bakery', quantityKg: 3, date: '2026-05-20', status: 'Available' },
  { id: 'd24', donor: 'Sunrise Cafe', ngo: null, category: 'Dairy', quantityKg: 2.5, date: '2026-05-26', status: 'Available' },
  { id: 'd25', donor: 'Corner Deli', ngo: null, category: 'Packaged', quantityKg: 8, date: '2026-05-28', status: 'Available' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isDelivered(donation: ImpactDonation): boolean {
  return donation.status === 'Claimed' || donation.status === 'Completed';
}

// key is "yyyy-mm"
function monthLabel(key: string): string {
  const year = key.slice(0, 4);
  const monthIndex = Number(key.slice(5, 7)) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function computeImpact(donations: ImpactDonation[]): ImpactSummary {
  const delivered = donations.filter(isDelivered);

  const foodSavedKg = round1(delivered.reduce((sum, d) => sum + d.quantityKg, 0));
  const mealsSaved = Math.floor(foodSavedKg / MEAL_WEIGHT_KG);

  // Monthly totals: every month that appears in the data gets an entry, even if zero.
  const monthTotals = new Map<string, number>();
  for (const d of donations) {
    const key = d.date.slice(0, 7);
    if (!monthTotals.has(key)) monthTotals.set(key, 0);
  }
  for (const d of delivered) {
    const key = d.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + d.quantityKg);
  }
  const monthly = [...monthTotals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, kg]) => ({ month: monthLabel(key), kg: round1(kg) }));

  const categoryTotals = new Map<string, number>();
  for (const d of delivered) {
    categoryTotals.set(d.category, (categoryTotals.get(d.category) ?? 0) + d.quantityKg);
  }
  const byCategory = [...categoryTotals.entries()]
    .map(([category, kg]) => ({ category, kg: round1(kg) }))
    .sort((a, b) => b.kg - a.kg || a.category.localeCompare(b.category));

  const ngoCounts = new Map<string, number>();
  for (const d of delivered) {
    if (d.ngo === null) continue;
    ngoCounts.set(d.ngo, (ngoCounts.get(d.ngo) ?? 0) + 1);
  }
  const topNgos = [...ngoCounts.entries()]
    .map(([ngo, donationCount]) => ({ ngo, donations: donationCount }))
    .sort((a, b) => b.donations - a.donations || a.ngo.localeCompare(b.ngo));

  return {
    totalDonations: donations.length,
    foodSavedKg,
    mealsSaved,
    ngosSupported: topNgos.length,
    monthly,
    byCategory,
    topNgos,
  };
}
