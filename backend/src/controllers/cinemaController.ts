import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { calculateBookingQuote } from "../algorithms/bookingQuote.js";

/**
 * POST /api/cinemas
 * Create a new cinema with opening-night bundle sizes
 */
export async function createCinema(req: Request, res: Response) {
  try {
    const { name, bundleSizes } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Cinema name is required." });
    }

    if (!Array.isArray(bundleSizes) || bundleSizes.length < 1 || bundleSizes.length > 10) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "A cinema must offer between 1 and 10 bundle sizes.",
      });
    }

    const parsedSizes = bundleSizes.map((s) => Number(s));
    for (const size of parsedSizes) {
      if (!Number.isInteger(size) || size < 1 || size > 500) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Each bundle size must be an integer between 1 and 500 seats.",
        });
      }
    }

    // Check unique name
    const existing = await prisma.cinema.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(409).json({
        error: "DUPLICATE_NAME",
        message: `A cinema with name "${name.trim()}" already exists.`,
      });
    }

    const cinema = await prisma.cinema.create({
      data: {
        name: name.trim(),
        bundleSizes: Array.from(new Set(parsedSizes)).sort((a, b) => a - b),
      },
    });

    return res.status(201).json(cinema);
  } catch (error: any) {
    console.error("Error creating cinema:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

/**
 * GET /api/cinemas
 * List all cinemas
 */
export async function listCinemas(_req: Request, res: Response) {
  try {
    const cinemas = await prisma.cinema.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(cinemas);
  } catch (error: any) {
    console.error("Error listing cinemas:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

/**
 * GET /api/cinemas/:id/booking?groupSize=6
 * Calculate booking quote for the requested group size
 */
export async function getBookingQuote(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { groupSize } = req.query;

    if (!groupSize) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Query parameter 'groupSize' is required.",
      });
    }

    const groupSizeNum = Number(groupSize);
    if (!Number.isInteger(groupSizeNum) || groupSizeNum < 1 || groupSizeNum > 10000) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Group size must be an integer between 1 and 10,000.",
      });
    }

    const cinema = await prisma.cinema.findUnique({
      where: { id },
    });

    if (!cinema) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Cinema with ID ${id} not found.`,
      });
    }

    const quote = calculateBookingQuote(cinema.bundleSizes, groupSizeNum);
    return res.json({
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      ...quote,
    });
  } catch (error: any) {
    console.error("Error calculating booking quote:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}
