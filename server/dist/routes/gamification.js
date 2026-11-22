import express from "express";
import { buildProfile } from "../matching/profile.js";
import { SAMPLE_NGOS } from "../matching/sampleNgos.js";
import { buildAchievement } from "../gamification/badges.js";
import { buildLeaderboard } from "../gamification/leaderboard.js";
import { SAMPLE_VOLUNTEERS } from "../gamification/sampleVolunteers.js";
const router = express.Router();
// Sample mode only, no Supabase. NGO profiles are shaped the same way routes/ngos.ts shapes SAMPLE_NGOS.
function sampleNgoProfiles() {
    return SAMPLE_NGOS.map((ngo) => buildProfile(ngo, ngo.stats));
}
function isKind(value) {
    return value === "ngo" || value === "volunteer";
}
router.get("/leaderboard", (_req, res) => {
    res.status(200).json({ leaderboard: buildLeaderboard(sampleNgoProfiles(), SAMPLE_VOLUNTEERS) });
});
router.get("/:kind/:id", (req, res) => {
    const kind = req.params.kind;
    if (!isKind(kind)) {
        res.status(400).json({ error: "Invalid input" });
        return;
    }
    const rows = kind === "ngo"
        ? sampleNgoProfiles().map((ngo) => ({ id: ngo.id, name: ngo.name, meals: ngo.totalMealsDistributed }))
        : SAMPLE_VOLUNTEERS;
    const row = rows.find((entity) => entity.id === req.params.id);
    if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.status(200).json({
        achievement: buildAchievement({ id: row.id, name: row.name, kind, meals: row.meals }),
    });
});
export default router;
