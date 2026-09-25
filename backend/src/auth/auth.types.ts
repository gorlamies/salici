import type { Request } from "express";

// sub = username
export type AuthenticatedRequest = Request & { user: { sub: string } };
