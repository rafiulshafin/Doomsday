import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import movieRoutes from "./routes/movieRoutes.js";
import cinemaRoutes from "./routes/cinemaRoutes.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Healthcheck endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes (all routes under /api as specified in PDF)
  app.use("/api/movies", movieRoutes);
  app.use("/api/cinemas", cinemaRoutes);

  // Serve Frontend static assets if built (for all-in-one deployments)
  const possibleDistPaths = [
    path.resolve(process.cwd(), "../frontend/dist"),
    path.resolve(process.cwd(), "frontend/dist"),
    path.resolve(process.cwd(), "dist/frontend"),
  ];
  const distDir = possibleDistPaths.find((p) => fs.existsSync(p));

  if (distDir) {
    app.use(express.static(distDir));
    app.get("*", (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api") || req.path === "/health") {
        return next();
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    // 404 handler for API
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: "NOT_FOUND", message: "Endpoint not found." });
    });
  }

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  });

  return app;
}
