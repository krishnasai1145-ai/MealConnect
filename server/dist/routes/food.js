import express from "express";
import { createUserSupabase, getSupabase } from "../supabase.js";
import { ALLOWED_TRANSITIONS, STATUSES, foodListingInput, foodListingUpdate, } from "../food/schema.js";
import { SAMPLE_DONOR_ID, claimSample, listAvailableSample } from "../food/sampleStore.js";
import { claimListing, deleteListing, getListing, insertListing, listAvailableListings, listListings, listNgoProfiles, updateListing, } from "../food/repository.js";
import { SAMPLE_NGOS } from "../matching/sampleNgos.js";
import { rankNgos } from "../matching/score.js";
import { trustScore } from "../matching/trust.js";
const router = express.Router();
// Sample-mode claimant: the default sample caller is the donor, who cannot claim their own listings.
const SAMPLE_NGO_ID = "00000000-0000-0000-0000-000000000002";
// Food routes do not use requireAuth (it returns 503 when Supabase is unset).
// When SUPABASE_URL / SUPABASE_ANON_KEY are unset, callers act as the sample donor and the in-memory store is used.
async function resolveFoodUser(req, res) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return { id: SAMPLE_DONOR_ID, token: undefined, sample: true };
    }
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return null;
    }
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data.user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return null;
    }
    return { id: data.user.id, token, sample: false };
}
// Null client selects the in-memory sample store in the repository.
function clientFor(user) {
    if (user.sample || !user.token) {
        return null;
    }
    return createUserSupabase(user.token);
}
// Ranking input for an NGO, carrying its verification flag and trust score so each Match can show them.
function toRankingNgo(ngo) {
    return {
        id: ngo.id,
        name: ngo.name,
        latitude: ngo.latitude,
        longitude: ngo.longitude,
        needKg: ngo.needKg,
        verified: ngo.verified,
        trustScore: trustScore(ngo.stats),
    };
}
// Sample mode uses the fixed sample NGOs; Supabase mode reads ngo_profiles through the caller's client.
async function loadNgos(user) {
    const client = clientFor(user);
    if (!client) {
        return SAMPLE_NGOS.map(toRankingNgo);
    }
    return (await listNgoProfiles(client)).map(toRankingNgo);
}
function isFoodStatus(value) {
    return typeof value === "string" && STATUSES.includes(value);
}
function isNotConfiguredError(err) {
    return err instanceof Error && err.message.startsWith("Supabase is not configured");
}
function handle(fn) {
    return (req, res, next) => {
        fn(req, res).catch((err) => {
            if (isNotConfiguredError(err)) {
                res.status(503).json({ error: "Authentication service not configured" });
                return;
            }
            next(err);
        });
    };
}
router.post("/", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const parsed = foodListingInput.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
    }
    const listing = await insertListing(clientFor(user), user.id, parsed.data);
    // Matching is best-effort: a failure to load NGOs must not fail the post.
    let matches = [];
    try {
        const ngos = await loadNgos(user);
        matches = rankNgos(listing, ngos, new Date());
    }
    catch (err) {
        console.warn("Smart matching skipped for listing", listing.id, err);
    }
    res.status(201).json({ listing, matches });
}));
router.get("/", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const raw = req.query.status;
    let status;
    if (raw !== undefined) {
        if (!isFoodStatus(raw)) {
            res.status(400).json({ error: "Invalid status", allowed: STATUSES });
            return;
        }
        status = raw;
    }
    const listings = await listListings(clientFor(user), user.id, status);
    res.status(200).json({ listings });
}));
// Lists Available listings from every donor. Works without a token (resolveFoodUser falls back to the sample caller).
router.get("/available", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const rawCategory = req.query.category;
    if (rawCategory !== undefined && typeof rawCategory !== "string") {
        res.status(400).json({ error: "Invalid input" });
        return;
    }
    const category = rawCategory && rawCategory.trim() !== "" ? rawCategory.trim() : undefined;
    const rawMin = req.query.minQuantity;
    let minQuantity;
    if (rawMin !== undefined) {
        const parsed = typeof rawMin === "string" && rawMin.trim() !== "" ? Number(rawMin) : NaN;
        if (!Number.isFinite(parsed) || parsed <= 0) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }
        minQuantity = parsed;
    }
    const filters = { category, minQuantity };
    const listings = user.sample
        ? listAvailableSample(filters)
        : await listAvailableListings(clientFor(user), filters);
    res.status(200).json({ listings });
}));
// Moves an Available listing to Claimed for the calling NGO.
router.post("/:id/claim", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const id = req.params.id;
    if (user.sample) {
        const result = claimSample(id, SAMPLE_NGO_ID);
        switch (result.kind) {
            case "ok":
                res.status(200).json({ listing: result.listing });
                return;
            case "notFound":
                res.status(404).json({ error: "Not found" });
                return;
            case "notAvailable":
                res.status(409).json({ error: "Listing is no longer available" });
                return;
            case "ownListing":
                res.status(403).json({ error: "Donors cannot claim their own listings" });
                return;
        }
    }
    const client = clientFor(user);
    if (!client) {
        throw new Error("Food claim requires a per-user Supabase client");
    }
    const claimed = await claimListing(client, id);
    if (claimed) {
        res.status(200).json({ listing: claimed });
        return;
    }
    // The RPC returned no row. Look the listing up to report why.
    const current = await getListing(client, id);
    if (!current) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    if (current.status !== "Available") {
        res.status(409).json({ error: "Listing is no longer available" });
        return;
    }
    res.status(403).json({ error: "Donors cannot claim their own listings" });
}));
// Ranks the top NGOs for an existing listing. Only the donor who owns it may read the matches.
router.get("/:id/matches", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const listing = await getListing(clientFor(user), req.params.id);
    if (!listing) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    if (!user.sample && listing.donorId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const ngos = await loadNgos(user);
    res.status(200).json({ matches: rankNgos(listing, ngos, new Date()) });
}));
router.get("/:id", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const listing = await getListing(clientFor(user), req.params.id);
    if (!listing) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    if (listing.donorId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    res.status(200).json({ listing });
}));
router.put("/:id", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const parsed = foodListingUpdate.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
    }
    const client = clientFor(user);
    const current = await getListing(client, req.params.id);
    if (!current) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    if (current.donorId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const nextStatus = parsed.data.status;
    if (nextStatus !== undefined && nextStatus !== current.status) {
        const allowed = ALLOWED_TRANSITIONS[current.status];
        if (!allowed.includes(nextStatus)) {
            res.status(409).json({ error: "Invalid status transition", from: current.status, to: nextStatus });
            return;
        }
    }
    const listing = await updateListing(client, req.params.id, parsed.data);
    if (!listing) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.status(200).json({ listing });
}));
router.delete("/:id", handle(async (req, res) => {
    const user = await resolveFoodUser(req, res);
    if (!user) {
        return;
    }
    const client = clientFor(user);
    const current = await getListing(client, req.params.id);
    if (!current) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    if (current.donorId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    if (current.status !== "Available") {
        res.status(409).json({ error: "Only available listings can be deleted" });
        return;
    }
    const deleted = await deleteListing(client, req.params.id);
    if (!deleted) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.status(204).end();
}));
export default router;
