/**
 * Feature 1: Movies and Rewatch Order Algorithm
 * 
 * Rules:
 * - Written from scratch without external graph or topological sort libraries.
 * - Detects direct and transitive circular dependencies, throwing/rejecting with 409 CIRCULAR_DEPENDENCY.
 * - Computes complete rewatch order: every movie that must be seen before the target movie
 *   (its prerequisites, their prerequisites, and so on), each exactly once, in an order
 *   where every movie comes after its prerequisites.
 * - Excludes the target movie itself.
 * - Calculates total watched count and remaining unwatched runtime in minutes.
 */

export interface MovieNode {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number; // in minutes (1–300)
  watched: boolean;
  prerequisites: string[]; // List of movie IDs that must be watched before this movie
}

export interface RewatchOrderResult {
  movies: MovieNode[];
  watchedCount: number;
  unwatchedRuntime: number;
}

export class CircularDependencyError extends Error {
  readonly code = "CIRCULAR_DEPENDENCY";
  readonly statusCode = 409;

  constructor(message: string = "A circular dependency was detected in movie prerequisites.") {
    super(message);
    this.name = "CircularDependencyError";
  }
}

/**
 * Validates whether adding/updating prerequisite relations would create a circular dependency.
 * 
 * @param movieId The movie being created or updated
 * @param proposedPrerequisiteIds The proposed list of prerequisite IDs for this movie
 * @param existingGraph Map of movieId -> array of prerequisite IDs for all other movies in the DB
 * @throws CircularDependencyError if adding proposedPrerequisiteIds creates a direct or transitive cycle
 */
export function validateNoCircularDependency(
  movieId: string,
  proposedPrerequisiteIds: string[],
  existingGraph: Map<string, string[]>
): void {
  // 1. Direct self-dependency check (a movie cannot depend on itself)
  if (proposedPrerequisiteIds.includes(movieId)) {
    throw new CircularDependencyError(`Movie cannot depend on itself directly.`);
  }

  // Construct a temporary graph containing the proposed edges
  const tempGraph = new Map<string, string[]>();
  for (const [key, value] of existingGraph.entries()) {
    if (key !== movieId) {
      tempGraph.set(key, [...value]);
    }
  }
  tempGraph.set(movieId, [...proposedPrerequisiteIds]);

  // 2. Transitive reachability check:
  // If we can reach `movieId` starting from any of its proposed prerequisites,
  // then adding `movieId -> proposedPrerequisite` forms a directed cycle.
  for (const prereqId of proposedPrerequisiteIds) {
    const visited = new Set<string>();
    const queue: string[] = [prereqId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === movieId) {
        throw new CircularDependencyError(
          `Circular dependency detected: prerequisite ${prereqId} transitively requires ${movieId}.`
        );
      }

      if (!visited.has(current)) {
        visited.add(current);
        const nextPrereqs = tempGraph.get(current) || [];
        for (const next of nextPrereqs) {
          if (!visited.has(next)) {
            queue.push(next);
          }
        }
      }
    }
  }

  // 3. Full-graph DFS cycle detection (three-color marking: 0 = unvisited, 1 = visiting, 2 = visited)
  const state = new Map<string, number>(); // 1: visiting, 2: visited

  function hasCycle(nodeId: string): boolean {
    state.set(nodeId, 1);
    const neighbors = tempGraph.get(nodeId) || [];

    for (const neighbor of neighbors) {
      const neighborState = state.get(neighbor) || 0;
      if (neighborState === 1) {
        return true; // Cycle detected: back-edge to an active ancestor
      }
      if (neighborState === 0) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
    }

    state.set(nodeId, 2);
    return false;
  }

  for (const nodeId of tempGraph.keys()) {
    if ((state.get(nodeId) || 0) === 0) {
      if (hasCycle(nodeId)) {
        throw new CircularDependencyError(`Graph contains a circular dependency cycle.`);
      }
    }
  }
}

/**
 * Computes the rewatch order for a target movie.
 * 
 * Uses custom BFS traversal to collect all transitive prerequisites,
 * followed by Kahn's Topological Sort algorithm to guarantee that
 * every movie appears strictly after all of its prerequisites.
 * 
 * @param targetMovieId The ID of the target movie
 * @param movieMap Map of all available MovieNode objects keyed by ID
 * @returns RewatchOrderResult containing ordered movies, watched count, and remaining unwatched runtime
 */
export function computeRewatchOrder(
  targetMovieId: string,
  movieMap: Map<string, MovieNode>
): RewatchOrderResult {
  const targetMovie = movieMap.get(targetMovieId);
  if (!targetMovie) {
    throw new Error(`Movie with ID ${targetMovieId} not found.`);
  }

  // Step 1: Collect all transitive prerequisites using BFS (excluding target itself)
  const requiredMovieIds = new Set<string>();
  const queue: string[] = [...targetMovie.prerequisites];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === targetMovieId) {
      throw new CircularDependencyError(`Target movie depends on itself through a prerequisite cycle.`);
    }

    if (!requiredMovieIds.has(currentId)) {
      requiredMovieIds.add(currentId);
      const node = movieMap.get(currentId);
      if (node && node.prerequisites.length > 0) {
        for (const prereqId of node.prerequisites) {
          if (!requiredMovieIds.has(prereqId)) {
            queue.push(prereqId);
          }
        }
      }
    }
  }

  // If target movie has no prerequisites, return empty list
  if (requiredMovieIds.size === 0) {
    return {
      movies: [],
      watchedCount: 0,
      unwatchedRuntime: 0,
    };
  }

  // Step 2: Build the dependency subgraph restricted to requiredMovieIds.
  // Note: in rewatch order, if P is a prerequisite of M, P must be watched BEFORE M.
  // Therefore, M depends on P.
  // in-degree of M in the watch graph = number of unfulfilled prerequisites of M that are in the subgraph.
  const inDegree = new Map<string, number>();
  // dependentsMap: P -> list of movies in subgraph that require P first
  const dependentsMap = new Map<string, string[]>();

  for (const id of requiredMovieIds) {
    inDegree.set(id, 0);
    dependentsMap.set(id, []);
  }

  for (const id of requiredMovieIds) {
    const node = movieMap.get(id);
    if (!node) continue;

    // Filter prerequisites to only those present in the required subgraph
    const relevantPrereqs = node.prerequisites.filter((pId) => requiredMovieIds.has(pId));
    inDegree.set(id, relevantPrereqs.length);

    for (const prereqId of relevantPrereqs) {
      dependentsMap.get(prereqId)!.push(id);
    }
  }

  // Step 3: Kahn's Algorithm for Topological Sort
  // Seed the ready queue with all movies having in-degree 0 (no unfulfilled prerequisites)
  const readyQueue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      readyQueue.push(id);
    }
  }

  // Sort readyQueue by releaseYear (or title) for deterministic, chronologically natural ordering
  readyQueue.sort((a, b) => {
    const movieA = movieMap.get(a)!;
    const movieB = movieMap.get(b)!;
    if (movieA.releaseYear !== movieB.releaseYear) {
      return movieA.releaseYear - movieB.releaseYear;
    }
    return movieA.title.localeCompare(movieB.title);
  });

  const orderedMovies: MovieNode[] = [];

  while (readyQueue.length > 0) {
    const currentId = readyQueue.shift()!;
    const movie = movieMap.get(currentId)!;
    orderedMovies.push(movie);

    const dependents = dependentsMap.get(currentId) || [];
    for (const depId of dependents) {
      const newDeg = (inDegree.get(depId) || 0) - 1;
      inDegree.set(depId, newDeg);

      if (newDeg === 0) {
        readyQueue.push(depId);
        // Maintain deterministic ordering
        readyQueue.sort((a, b) => {
          const movieA = movieMap.get(a)!;
          const movieB = movieMap.get(b)!;
          if (movieA.releaseYear !== movieB.releaseYear) {
            return movieA.releaseYear - movieB.releaseYear;
          }
          return movieA.title.localeCompare(movieB.title);
        });
      }
    }
  }

  // If not all movies were processed, there was an undetected cycle
  if (orderedMovies.length !== requiredMovieIds.size) {
    throw new CircularDependencyError(`Circular dependency detected within prerequisites.`);
  }

  // Step 4: Compute statistics
  const watchedCount = orderedMovies.filter((m) => m.watched).length;
  const unwatchedRuntime = orderedMovies
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + m.runtime, 0);

  return {
    movies: orderedMovies,
    watchedCount,
    unwatchedRuntime,
  };
}
