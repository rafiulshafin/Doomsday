import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
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

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Endpoint not found." });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
  });

  return app;
}
