import type { Express, Request, Response } from "express";
import { storage as dbStorage } from "./storage";

export function setupTeamsRoutes(app: Express) {
  // Get team statistics
  app.get("/api/teams/stats", async (req: Request, res: Response) => {
    try {
      const stats = await dbStorage.getTeamStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ error: "Failed to fetch team statistics" });
    }
  });

  // Get specialties with agent counts
  app.get("/api/teams/specialties", async (req: Request, res: Response) => {
    try {
      const specialties = await dbStorage.getSpecialtiesWithCounts();
      res.json(specialties);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      res.status(500).json({ error: "Failed to fetch specialties" });
    }
  });
}