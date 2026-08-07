import type { NextFunction, Request, Response } from "express";
import { createRequestId } from "../utils/request-id.js";

declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header("x-request-id") ?? createRequestId();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
