import { describe, it, expect } from "vitest";
import { calculateBookingQuote } from "../algorithms/bookingQuote.js";

describe("Feature 2: Cinemas & Watch-Party Booking Algorithm", () => {
  it("should calculate [1, 3, 4] for group size 6 => 2 bundles: 3 × 2", () => {
    const result = calculateBookingQuote([1, 3, 4], 6);

    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(2);
    expect(result.bundles).toEqual([{ size: 3, count: 2 }]);
    expect(result.formatted).toBe("2 bundles: 3 × 2");
  });

  it("should calculate [2, 5] for group size 11 => 4 bundles: 5 × 1, 2 × 3", () => {
    const result = calculateBookingQuote([2, 5], 11);

    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(4);
    expect(result.bundles).toEqual([
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ]);
    expect(result.formatted).toBe("4 bundles: 5 × 1, 2 × 3");
  });

  it("should calculate [6, 9, 20] for group size 44 => 4 bundles: 20 × 1, 9 × 2, 6 × 1", () => {
    const result = calculateBookingQuote([6, 9, 20], 44);

    expect(result.possible).toBe(true);
    expect(result.totalBundles).toBe(4);
    expect(result.bundles).toEqual([
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
    expect(result.formatted).toBe("4 bundles: 20 × 1, 9 × 2, 6 × 1");
  });

  it("should return 'Not possible' for [4, 6] and group size 7", () => {
    const result = calculateBookingQuote([4, 6], 7);

    expect(result.possible).toBe(false);
    expect(result.totalBundles).toBe(0);
    expect(result.bundles).toEqual([]);
    expect(result.formatted).toBe("Not possible");
  });

  it("should handle large group sizes up to 10,000 efficiently", () => {
    const start = performance.now();
    const result = calculateBookingQuote([25, 50, 100, 250], 9875);
    const duration = performance.now() - start;

    expect(result.possible).toBe(true);
    expect(duration).toBeLessThan(100); // Should execute in under 100ms
    // Check that sum equals group size
    const totalSeats = result.bundles.reduce((sum, b) => sum + b.size * b.count, 0);
    expect(totalSeats).toBe(9875);
  });

  it("should validate input constraints (group size range and bundle sizes)", () => {
    expect(() => calculateBookingQuote([5], 0)).toThrow();
    expect(() => calculateBookingQuote([5], 10001)).toThrow();
    expect(() => calculateBookingQuote([], 50)).toThrow();
  });
});
