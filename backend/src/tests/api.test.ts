import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";

// Mock prisma for isolated API contract unit tests
vi.mock("../prisma.js", () => {
  return {
    prisma: {
      movie: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      moviePrerequisite: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      cinema: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    },
  };
});

describe("API Endpoints Contract", () => {
  const app = createApp();

  it("GET /health should return 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/cinemas/:id/booking?groupSize=44 calculates quote properly", async () => {
    vi.mocked(prisma.cinema.findUnique).mockResolvedValueOnce({
      id: "cinema-campus",
      name: "Avengers Campus Theater",
      bundleSizes: [6, 9, 20],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).get("/api/cinemas/cinema-campus/booking?groupSize=44");
    expect(res.status).toBe(200);
    expect(res.body.possible).toBe(true);
    expect(res.body.totalBundles).toBe(4);
    expect(res.body.formatted).toBe("4 bundles: 20 × 1, 9 × 2, 6 × 1");
  });

  it("GET /api/cinemas/:id/booking without groupSize returns 400", async () => {
    const res = await request(app).get("/api/cinemas/cinema-campus/booking");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("POST /api/movies validates runtime is between 1 and 300", async () => {
    const res = await request(app)
      .post("/api/movies")
      .send({ title: "Super Long Movie", releaseYear: 2026, runtime: 500 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown endpoints", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
  });
});
