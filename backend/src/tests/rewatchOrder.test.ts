import { describe, it, expect } from "vitest";
import {
  MovieNode,
  computeRewatchOrder,
  validateNoCircularDependency,
  CircularDependencyError,
} from "../algorithms/rewatchOrder.js";

describe("Feature 1: Movies & Rewatch Order Algorithm", () => {
  // Sample data directly from the assessment specification
  const createSampleDataset = (): Map<string, MovieNode> => {
    const movies: MovieNode[] = [
      { id: "iron-man", title: "Iron Man", releaseYear: 2008, runtime: 126, watched: true, prerequisites: [] },
      { id: "first-avenger", title: "Captain America: The First Avenger", releaseYear: 2011, runtime: 124, watched: true, prerequisites: [] },
      { id: "the-avengers", title: "The Avengers", releaseYear: 2012, runtime: 143, watched: true, prerequisites: ["iron-man", "first-avenger"] },
      { id: "civil-war", title: "Captain America: Civil War", releaseYear: 2016, runtime: 147, watched: false, prerequisites: ["the-avengers"] },
      { id: "ragnarok", title: "Thor: Ragnarok", releaseYear: 2017, runtime: 130, watched: false, prerequisites: [] },
      { id: "infinity-war", title: "Avengers: Infinity War", releaseYear: 2018, runtime: 149, watched: false, prerequisites: ["civil-war", "ragnarok"] },
      { id: "endgame", title: "Avengers: Endgame", releaseYear: 2019, runtime: 181, watched: false, prerequisites: ["infinity-war"] },
      { id: "doomsday", title: "Avengers: Doomsday", releaseYear: 2026, runtime: 180, watched: false, prerequisites: ["endgame"] },
    ];

    const map = new Map<string, MovieNode>();
    for (const m of movies) {
      map.set(m.id, m);
    }
    return map;
  };

  it("should return all 7 previous movies in valid topological order for Avengers: Doomsday", () => {
    const movieMap = createSampleDataset();
    const result = computeRewatchOrder("doomsday", movieMap);

    const titles = result.movies.map((m) => m.title);
    expect(titles).toHaveLength(7);

    // Verify target itself is not included
    expect(titles).not.toContain("Avengers: Doomsday");

    // Verify ordering constraints: every movie must appear strictly AFTER its prerequisites
    const indexOf = (title: string) => titles.indexOf(title);

    expect(indexOf("Iron Man")).toBeLessThan(indexOf("The Avengers"));
    expect(indexOf("Captain America: The First Avenger")).toBeLessThan(indexOf("The Avengers"));
    expect(indexOf("The Avengers")).toBeLessThan(indexOf("Captain America: Civil War"));
    expect(indexOf("Captain America: Civil War")).toBeLessThan(indexOf("Avengers: Infinity War"));
    expect(indexOf("Thor: Ragnarok")).toBeLessThan(indexOf("Avengers: Infinity War"));
    expect(indexOf("Avengers: Infinity War")).toBeLessThan(indexOf("Avengers: Endgame"));

    // Check stats: 3 watched (Iron Man, First Avenger, The Avengers), 4 unwatched
    expect(result.watchedCount).toBe(3);
    const expectedUnwatchedRuntime = 147 + 130 + 149 + 181; // Civil War + Ragnarok + Infinity War + Endgame = 607
    expect(result.unwatchedRuntime).toBe(expectedUnwatchedRuntime);
  });

  it("should return Iron Man and The First Avenger (in either order), then The Avengers for Civil War", () => {
    const movieMap = createSampleDataset();
    const result = computeRewatchOrder("civil-war", movieMap);

    const titles = result.movies.map((m) => m.title);
    expect(titles).toHaveLength(3);

    const indexOf = (title: string) => titles.indexOf(title);
    expect(indexOf("Iron Man")).toBeLessThan(indexOf("The Avengers"));
    expect(indexOf("Captain America: The First Avenger")).toBeLessThan(indexOf("The Avengers"));
  });

  it("should return an empty list for Thor: Ragnarok (since it has no prerequisites)", () => {
    const movieMap = createSampleDataset();
    const result = computeRewatchOrder("ragnarok", movieMap);

    expect(result.movies).toEqual([]);
    expect(result.watchedCount).toBe(0);
    expect(result.unwatchedRuntime).toBe(0);
  });

  it("should detect direct self-dependency and throw CircularDependencyError (409)", () => {
    const movieMap = createSampleDataset();
    const existingGraph = new Map<string, string[]>();
    for (const [id, m] of movieMap.entries()) {
      existingGraph.set(id, m.prerequisites);
    }

    expect(() => {
      validateNoCircularDependency("iron-man", ["iron-man"], existingGraph);
    }).toThrow(CircularDependencyError);
  });

  it("should detect transitive circular dependency (e.g. Endgame as a prerequisite of Iron Man) with 409", () => {
    const movieMap = createSampleDataset();
    const existingGraph = new Map<string, string[]>();
    for (const [id, m] of movieMap.entries()) {
      existingGraph.set(id, m.prerequisites);
    }

    // Making Avengers: Endgame a prerequisite of Iron Man creates:
    // Iron Man -> Endgame -> Infinity War -> Civil War -> Avengers -> Iron Man!
    expect(() => {
      validateNoCircularDependency("iron-man", ["endgame"], existingGraph);
    }).toThrow(CircularDependencyError);

    try {
      validateNoCircularDependency("iron-man", ["endgame"], existingGraph);
    } catch (err: any) {
      expect(err).toBeInstanceOf(CircularDependencyError);
      expect(err.code).toBe("CIRCULAR_DEPENDENCY");
      expect(err.statusCode).toBe(409);
    }
  });
});
