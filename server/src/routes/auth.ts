import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { getSupabase } from "../supabase.js";
import { requireAuth, roleOf } from "../middleware/auth.js";
import { getAuthUser } from "../middleware/roles.js";

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "host"]).optional().default("user"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function isNotConfiguredError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("Supabase is not configured");
}

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (isNotConfiguredError(err)) {
    res.status(503).json({ error: "Authentication service not configured" });
    return;
  }
  next(err);
}

router.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password, role } = parsed.data;
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (error || !data.user) {
      res.status(400).json({ error: error?.message ?? "Signup failed" });
      return;
    }

    res.status(201).json({
      user: { id: data.user.id, email: data.user.email, role: roleOf(data.user) },
      session: data.session ?? null,
      message: data.session ? undefined : "Check your email to confirm your account",
    });
  } catch (err) {
    handleError(err, res, next);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    res.status(200).json({
      user: { id: data.user.id, email: data.user.email, role: roleOf(data.user) },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    handleError(err, res, next);
  }
});

router.get("/me", requireAuth, (_req: Request, res: Response) => {
  res.status(200).json({ user: getAuthUser(res) });
});

export default router;
