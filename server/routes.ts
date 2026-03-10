import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.health.check.path, (req, res) => {
    res.json({ status: "ok" });
  });

  return httpServer;
}
