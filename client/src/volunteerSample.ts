export type VolunteerStatus = "Available" | "Accepted" | "Completed";

export type VolunteerPickup = {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  pickupLocation: string;
  dropLocation: string;
  pickupBefore: string;
  status: VolunteerStatus;
};

export const VOLUNTEER_STATUSES: VolunteerStatus[] = ["Available", "Accepted", "Completed"];

export function makeSamplePickups(now: Date): VolunteerPickup[] {
  const hours = [1, 2, 3, 5, 7, 9];
  const pickupLocations = [
    "Green Kitchen, Indiranagar",
    "Maple Bakery, Koramangala",
    "Sunrise Cafe, Jayanagar",
    "Harvest Farm, Whitefield",
    "Corner Deli, HSR Layout",
    "Lotus Hall, MG Road",
  ];
  const dropLocations = [
    "City Food Bank, Shivajinagar",
    "Hope Shelter, Majestic",
    "Community Pantry, Basavanagudi",
    "Youth Meals Trust, Yeshwanthpur",
    "Community Pantry, Basavanagudi",
    "Hope Shelter, Majestic",
  ];
  const quantities = [12, 8, 20, 5, 15, 30];
  const units = ["kg", "portions", "kg", "kg", "kg", "portions"];
  const foodNames = [
    "Vegetable biryani",
    "Fresh bread loaves",
    "Mixed salad boxes",
    "Tomatoes and cucumbers",
    "Dal and rice",
    "Paneer wraps",
  ];
  const statuses: VolunteerStatus[] = ["Available", "Available", "Available", "Accepted", "Completed", "Completed"];

  return hours.map((n, i) => ({
    id: `vp-${i + 1}`,
    foodName: foodNames[i],
    quantity: quantities[i],
    unit: units[i],
    pickupLocation: pickupLocations[i],
    dropLocation: dropLocations[i],
    pickupBefore: new Date(now.getTime() + n * 3600000).toISOString(),
    status: statuses[i],
  }));
}

export function nextStatus(status: VolunteerStatus): VolunteerStatus | null {
  switch (status) {
    case "Available":
      return "Accepted";
    case "Accepted":
      return "Completed";
    case "Completed":
      return null;
  }
}
