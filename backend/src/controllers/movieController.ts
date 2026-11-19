import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  MovieNode,
  computeRewatchOrder,
  validateNoCircularDependency,
  CircularDependencyError,
} from "../algorithms/rewatchOrder.js";

/**
 * Helper to fetch all movies and construct an adjacency map of movieId -> prerequisiteIds
 */
async function buildPrerequisiteGraph(): Promise<{
  graph: Map<string, string[]>;
  nodeMap: Map<string, MovieNode>;
}> {
  const allMovies = await prisma.movie.findMany({
    include: {
      prerequisites: {
        select: { prerequisiteId: true },
      },
    },
    orderBy: { releaseYear: "asc" },
  });

  const graph = new Map<string, string[]>();
  const nodeMap = new Map<string, MovieNode>();

  for (const m of allMovies) {
    const prereqIds = m.prerequisites.map((p) => p.prerequisiteId);
    graph.set(m.id, prereqIds);
    nodeMap.set(m.id, {
      id: m.id,
      title: m.title,
      releaseYear: m.releaseYear,
      runtime: m.runtime,
      watched: m.watched,
      prerequisites: prereqIds,
    });
  }

  return { graph, nodeMap };
}

/**
 * POST /api/movies
 * Create a new movie
 */
export async function createMovie(req: Request, res: Response) {
  try {
    const { title, releaseYear, runtime, watched = false, prerequisites = [] } = req.body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Title is required." });
    }

    const yearNum = Number(releaseYear);
    if (!Number.isInteger(yearNum) || yearNum < 1888) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Valid release year is required." });
    }

    const runtimeNum = Number(runtime);
    if (!Number.isInteger(runtimeNum) || runtimeNum < 1 || runtimeNum > 300) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Runtime must be an integer between 1 and 300 minutes.",
      });
    }

    if (!Array.isArray(prerequisites)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Prerequisites must be an array of movie IDs.",
      });
    }

    // Check unique title
    const existingTitle = await prisma.movie.findUnique({
      where: { title: title.trim() },
    });
    if (existingTitle) {
      return res.status(409).json({
        error: "DUPLICATE_TITLE",
        message: `A movie with title "${title.trim()}" already exists.`,
      });
    }

    // Circular dependency check (using temporary ID)
    const tempId = "temp-new-movie-id";
    const { graph } = await buildPrerequisiteGraph();

    try {
      validateNoCircularDependency(tempId, prerequisites, graph);
    } catch (err) {
      if (err instanceof CircularDependencyError) {
        return res.status(409).json({
          error: "CIRCULAR_DEPENDENCY",
          message: err.message,
        });
      }
      throw err;
    }

    // Persist in transaction
    const movie = await prisma.$transaction(async (tx) => {
      const created = await tx.movie.create({
        data: {
          title: title.trim(),
          releaseYear: yearNum,
          runtime: runtimeNum,
          watched: Boolean(watched),
        },
      });

      if (prerequisites.length > 0) {
        await tx.moviePrerequisite.createMany({
          data: prerequisites.map((prereqId: string) => ({
            movieId: created.id,
            prerequisiteId: prereqId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.movie.findUnique({
        where: { id: created.id },
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      });
    });

    return res.status(201).json(movie);
  } catch (error: any) {
    console.error("Error creating movie:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

/**
 * GET /api/movies
 * List all movies
 */
export async function listMovies(_req: Request, res: Response) {
  try {
    const movies = await prisma.movie.findMany({
      include: {
        prerequisites: {
          include: {
            prerequisite: {
              select: { id: true, title: true, releaseYear: true, runtime: true, watched: true },
            },
          },
        },
      },
      orderBy: { releaseYear: "asc" },
    });

    return res.json(movies);
  } catch (error: any) {
    console.error("Error listing movies:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

/**
 * PATCH /api/movies/:id
 * Update movie attributes, watched status, and prerequisites
 */
export async function updateMovie(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, releaseYear, runtime, watched, prerequisites } = req.body;

    const existingMovie = await prisma.movie.findUnique({
      where: { id },
      include: { prerequisites: true },
    });

    if (!existingMovie) {
      return res.status(404).json({ error: "NOT_FOUND", message: `Movie with ID ${id} not found.` });
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Title cannot be empty." });
      }
      // Check title collision if changed
      if (title.trim() !== existingMovie.title) {
        const titleConflict = await prisma.movie.findUnique({ where: { title: title.trim() } });
        if (titleConflict) {
          return res.status(409).json({ error: "DUPLICATE_TITLE", message: "Movie title already taken." });
        }
      }
      updateData.title = title.trim();
    }

    if (releaseYear !== undefined) {
      const yearNum = Number(releaseYear);
      if (!Number.isInteger(yearNum) || yearNum < 1888) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Valid release year required." });
      }
      updateData.releaseYear = yearNum;
    }

    if (runtime !== undefined) {
      const runtimeNum = Number(runtime);
      if (!Number.isInteger(runtimeNum) || runtimeNum < 1 || runtimeNum > 300) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Runtime must be an integer between 1 and 300 minutes.",
        });
      }
      updateData.runtime = runtimeNum;
    }

    if (watched !== undefined) {
      updateData.watched = Boolean(watched);
    }

    // If prerequisites are being updated, check circular dependencies!
    if (prerequisites !== undefined) {
      if (!Array.isArray(prerequisites)) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Prerequisites must be an array of movie IDs.",
        });
      }

      const { graph } = await buildPrerequisiteGraph();

      try {
        validateNoCircularDependency(id, prerequisites, graph);
      } catch (err) {
        if (err instanceof CircularDependencyError) {
          return res.status(409).json({
            error: "CIRCULAR_DEPENDENCY",
            message: err.message,
          });
        }
        throw err;
      }
    }

    // Perform atomic update
    const updated = await prisma.$transaction(async (tx) => {
      if (prerequisites !== undefined) {
        // Clear old prerequisites and re-insert
        await tx.moviePrerequisite.deleteMany({
          where: { movieId: id },
        });

        if (prerequisites.length > 0) {
          await tx.moviePrerequisite.createMany({
            data: prerequisites.map((prereqId: string) => ({
              movieId: id,
              prerequisiteId: prereqId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.movie.update({
        where: { id },
        data: updateData,
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      });
    });

    return res.json(updated);
  } catch (error: any) {
    console.error("Error updating movie:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

/**
 * GET /api/movies/:id/rewatch-order
 * Compute ordered rewatch roadmap for target movie
 */
export async function getRewatchOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return res.status(404).json({ error: "NOT_FOUND", message: `Movie with ID ${id} not found.` });
    }

    const { nodeMap } = await buildPrerequisiteGraph();

    try {
      const result = computeRewatchOrder(id, nodeMap);
      return res.json({
        targetMovie: {
          id: movie.id,
          title: movie.title,
          releaseYear: movie.releaseYear,
          runtime: movie.runtime,
          watched: movie.watched,
        },
        movies: result.movies,
        watchedCount: result.watchedCount,
        unwatchedRuntime: result.unwatchedRuntime,
      });
    } catch (err) {
      if (err instanceof CircularDependencyError) {
        return res.status(409).json({
          error: "CIRCULAR_DEPENDENCY",
          message: err.message,
        });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Error computing rewatch order:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}
