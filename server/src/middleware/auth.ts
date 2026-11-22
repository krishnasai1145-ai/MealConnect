import type { RequestHandler } from "express";
import { getSupabase } from "../supabase.js";

export type AuthUser = {
  id: string;
  email: string | undefined;
  role: string;
};

type SupabaseUserLike = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export function roleOf(user: SupabaseUserLike): string {
  return String(user.app_metadata?.role ?? user.user_metadata?.role ?? "user");
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    res.status(503).json({ error: "Authentication service not configured" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email,
    role: roleOf(data.user),
  };
  res.locals.user = user;
  next();
};
