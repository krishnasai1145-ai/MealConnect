import type { RequestHandler, Response } from "express";
import type { AuthUser } from "./auth.js";

export function getAuthUser(res: Response): AuthUser | undefined {
  return res.locals.user as AuthUser | undefined;
}

export function requireRole(...allowed: string[]): RequestHandler {
  return (_req, res, next) => {
    const user = getAuthUser(res);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowed.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
