import { buildAchievement } from "./badges.js";
// Pure: NGOs and volunteers are ranked together by meals (descending), then by name (ascending).
export function buildLeaderboard(ngos, volunteers) {
    const entries = [
        ...ngos.map((ngo) => buildAchievement({ id: ngo.id, name: ngo.name, kind: "ngo", meals: ngo.totalMealsDistributed })),
        ...volunteers.map((volunteer) => buildAchievement({ id: volunteer.id, name: volunteer.name, kind: "volunteer", meals: volunteer.meals })),
    ];
    entries.sort((a, b) => {
        if (a.meals !== b.meals) {
            return b.meals - a.meals;
        }
        if (a.name < b.name) {
            return -1;
        }
        return a.name > b.name ? 1 : 0;
    });
    return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
