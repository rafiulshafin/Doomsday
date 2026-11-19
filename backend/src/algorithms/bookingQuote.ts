/**
 * Feature 2: Cinemas and Watch-Party Booking Algorithm
 * 
 * Rules:
 * - Written from scratch without knapsack, integer linear programming, or solver libraries.
 * - Computes the minimum number of seat bundles whose sizes sum up to EXACTLY the requested group size.
 * - Returns the bundle breakdown (how many of each size to buy) and human-readable quote string.
 * - If no exact combination exists, reports possible: false and formatted: "Not possible".
 */

export interface BundleBreakdown {
  size: number;
  count: number;
}

export interface BookingQuoteResult {
  possible: boolean;
  groupSize: number;
  totalBundles: number;
  bundles: BundleBreakdown[];
  formatted: string;
}

/**
 * Calculates the optimal (fewest) bundle combination to seat exactly groupSize attendees.
 * 
 * Uses custom Dynamic Programming (Unbounded Knapsack / Minimum Coin Change)
 * with state reconstruction.
 * 
 * @param bundleSizes Array of available bundle sizes (1–10 sizes, each 1–500)
 * @param groupSize Target number of seats (1–10,000)
 * @returns BookingQuoteResult
 */
export function calculateBookingQuote(
  bundleSizes: number[],
  groupSize: number
): BookingQuoteResult {
  if (groupSize < 1 || groupSize > 10000 || !Number.isInteger(groupSize)) {
    throw new Error(`Group size must be an integer between 1 and 10,000.`);
  }

  // Deduplicate and filter positive integers, then sort descending
  const validSizes = Array.from(new Set(bundleSizes))
    .filter((s) => Number.isInteger(s) && s >= 1 && s <= 500)
    .sort((a, b) => b - a);

  if (validSizes.length === 0 || validSizes.length > 10) {
    throw new Error(`Cinema must offer between 1 and 10 bundle sizes, each between 1 and 500.`);
  }

  // dp[w] stores the minimum number of bundles needed for exact seat count w
  // parent[w] stores the bundle size used to achieve dp[w]
  const INF = Number.MAX_SAFE_INTEGER;
  const dp: number[] = new Array(groupSize + 1).fill(INF);
  const parent: number[] = new Array(groupSize + 1).fill(-1);

  dp[0] = 0;

  for (let w = 1; w <= groupSize; w++) {
    for (const size of validSizes) {
      if (w >= size) {
        const prev = dp[w - size];
        if (prev !== INF && prev + 1 < dp[w]) {
          dp[w] = prev + 1;
          parent[w] = size;
        }
      }
    }
  }

  // Check if an exact combination was found
  if (dp[groupSize] === INF) {
    return {
      possible: false,
      groupSize,
      totalBundles: 0,
      bundles: [],
      formatted: "Not possible",
    };
  }

  // Backtrack to reconstruct the exact bundle counts
  const countMap = new Map<number, number>();
  let currentWeight = groupSize;

  while (currentWeight > 0) {
    const size = parent[currentWeight];
    if (size <= 0) break;
    countMap.set(size, (countMap.get(size) || 0) + 1);
    currentWeight -= size;
  }

  // Format the breakdown sorted descending by bundle size
  const breakdown: BundleBreakdown[] = Array.from(countMap.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  const totalBundles = dp[groupSize];

  // Build the formatted string matching spec: e.g. "4 bundles: 20 × 1, 9 × 2, 6 × 1"
  const breakdownParts = breakdown.map((b) => `${b.size} × ${b.count}`);
  const bundleWord = totalBundles === 1 ? "bundle" : "bundles";
  const formatted = `${totalBundles} ${bundleWord}: ${breakdownParts.join(", ")}`;

  return {
    possible: true,
    groupSize,
    totalBundles,
    bundles: breakdown,
    formatted,
  };
}
