import express, { type NextFunction, type Request, type Response } from "express";
import { createUserSupabase } from "../supabase.js";
import { listNgoProfiles } from "../food/repository.js";
import { buildProfile, type NgoRecord } from "../matching/profile.js";
import { SAMPLE_NGOS } from "../matching/sampleNgos.js";

const router = express.Router();

// Same convention as routes/food.ts: without SUPABASE_URL / SUPABASE_ANON_KEY, the fixed sample NGOs are served.
// With Supabase configured, a bearer token is required and ngo_profiles is read through the caller's client (RLS applies).
async function loadRecords(req: Request, res: Response): Promise<NgoRecord[] | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return [...SAMPLE_NGOS];
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return listNgoProfiles(createUserSupabase(token));
}

function isNotConfiguredError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Supabase is not configured");
}

type Handler = (req: Request, res: Response) => Promise<void>;

function handle(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch((err: unknown) => {
      if (isNotConfiguredError(err)) {
        res.status(503).json({ error: "Authentication service not configured" });
        return;
      }
      next(err);
    });
  };
}

router.get(
  "/",
  handle(async (req, res) => {
    const records = await loadRecords(req, res);
    if (!records) {
      return;
    }
    res.status(200).json({ ngos: records.map((ngo) => buildProfile(ngo, ngo.stats)) });
  }),
);

router.get(
  "/:id",
  handle(async (req, res) => {
    const records = await loadRecords(req, res);
    if (!records) {
      return;
    }
    const ngo = records.find((record) => record.id === req.params.id);
    if (!ngo) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(200).json({ ngo: buildProfile(ngo, ngo.stats) });
  }),
);

export default router;
