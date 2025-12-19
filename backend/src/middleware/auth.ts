import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { platform } from "node:os";

type JwtPayload = {
  id: number;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: payload.id };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
