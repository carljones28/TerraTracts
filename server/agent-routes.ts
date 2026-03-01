import type { Express, Request, Response } from "express";
import { storage as dbStorage } from "./storage";

export function setupAgentRoutes(app: Express) {
  // Agent directory endpoints
  app.get("/api/agents", async (req: Request, res: Response) => {
    try {
      // Extract query parameters for filtering
      const state = req.query.state as string | undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const expertise = Array.isArray(req.query.expertise) 
        ? req.query.expertise as string[] 
        : req.query.expertise 
          ? [req.query.expertise as string] 
          : undefined;
      const certifications = Array.isArray(req.query.certification) 
        ? req.query.certification as string[] 
        : req.query.certification 
          ? [req.query.certification as string] 
          : undefined;
      const minRating = req.query.minRating 
        ? parseFloat(req.query.minRating as string) 
        : undefined;
      const minTransactions = req.query.minTransactions 
        ? parseInt(req.query.minTransactions as string) 
        : undefined;
      const boundaryFilter = req.query.boundaryFilter 
        ? JSON.parse(req.query.boundaryFilter as string) 
        : undefined;
      
      // Get agents with filtering
      const agents = await dbStorage.getAgents({
        state,
        propertyType,
        expertise,
        certifications,
        minRating,
        minTransactions,
        boundaryFilter
      });
      
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ 
        message: "Failed to fetch agents",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/by-user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const agent = await dbStorage.getAgentWithProfileByUserId(userId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error(`Error fetching agent by user id ${req.params.userId}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await dbStorage.getAgentWithProfile(agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error(`Error fetching agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/:id/certifications", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const certifications = await dbStorage.getAgentCertifications(agentId);
      res.json(certifications);
    } catch (error) {
      console.error(`Error fetching certifications for agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent certifications",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/:id/reviews", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const reviews = await dbStorage.getAgentReviews(agentId);
      res.json(reviews);
    } catch (error) {
      console.error(`Error fetching reviews for agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent reviews",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/:id/transactions", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const transactions = await dbStorage.getAgentTransactions(agentId);
      res.json(transactions);
    } catch (error) {
      console.error(`Error fetching transactions for agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent transactions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/:id/properties", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const properties = await dbStorage.getPropertiesByAgent(agentId);
      res.json(properties);
    } catch (error) {
      console.error(`Error fetching properties for agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent properties",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agent-questions", async (req: Request, res: Response) => {
    try {
      const questions = await dbStorage.getAgentQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching agent questions:", error);
      res.status(500).json({ 
        message: "Failed to fetch agent questions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get("/api/agents/:id/questions", async (req: Request, res: Response) => {
    try {
      const agentId = parseInt(req.params.id);
      const questions = await dbStorage.getAgentAnsweredQuestions(agentId);
      res.json(questions);
    } catch (error) {
      console.error(`Error fetching questions for agent ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch agent questions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}