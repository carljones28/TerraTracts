import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupPostGIS } from "./postgis-setup";
import { setupFastRoutes } from "./fast-routes";
import path from "path";
import fs from "fs";
import compression from "compression";

const app = express();

// Add compression for better performance
app.use(compression());

// Optimized JSON parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  log("Created uploads directory");
} else {
  // Make sure directory has correct permissions 
  fs.chmodSync(uploadsDir, 0o755);
}

// Log the absolute path for debugging
log(`Uploads directory is at: ${uploadsDir}`);

// Serve uploads directory statically (with explicit options)
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set appropriate headers for different file types
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      // For images, allow caching
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      res.setHeader('Content-Type', 'image/' + path.extname(filePath).substring(1));
    } 
    else if (filePath.match(/\.(mp4|webm|ogg|mov)$/i)) {
      // For videos, set proper content type and allow range requests
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      
      const ext = path.extname(filePath).substring(1).toLowerCase();
      // Set the appropriate content type based on file extension
      if (ext === 'mp4') {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (ext === 'webm') {
        res.setHeader('Content-Type', 'video/webm');
      } else if (ext === 'ogg') {
        res.setHeader('Content-Type', 'video/ogg');
      } else if (ext === 'mov') {
        res.setHeader('Content-Type', 'video/quicktime');
      } else {
        // Default to mp4 for other video types
        res.setHeader('Content-Type', 'video/mp4');
      }
      
      log(`Serving video file: ${filePath} with content type: ${res.getHeader('Content-Type')}`);
    }
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Try to set up PostGIS extensions, but don't fail if it doesn't work
    try {
      log("Setting up PostGIS extensions and indices...");
      await setupPostGIS();
      log("PostGIS setup completed successfully");
    } catch (error) {
      console.error('Error setting up PostGIS:', error);
      log("PostGIS setup failed, continuing without geospatial features");
    }
    
    // Setup fast routes first for better performance
    setupFastRoutes(app);
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use PORT environment variable for deployment, fallback to 5000 for development
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Server initialization error:", error);
    process.exit(1);
  }
})();
