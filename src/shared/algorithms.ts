/**
 * Common algorithms and data processing utilities
 */

/**
 * Quickselect algorithm to find the k-th smallest element
 * Average O(n) time complexity
 */
export function quickselect(arr: number[], k: number): number {
  if (arr.length === 1) return arr[0];

  const pivot = arr[Math.floor(arr.length / 2)];
  const lows: number[] = [];
  const highs: number[] = [];
  const pivots: number[] = [];

  for (const num of arr) {
    if (num < pivot) lows.push(num);
    else if (num > pivot) highs.push(num);
    else pivots.push(num);
  }

  if (k < lows.length) {
    return quickselect(lows, k);
  } else if (k < lows.length + pivots.length) {
    return pivot;
  } else {
    return quickselect(highs, k - lows.length - pivots.length);
  }
}

/**
 * Calculate percentile values for an array of numbers using Quickselect
 * O(n * k) average time complexity where k is the number of percentiles
 * More efficient than full sort O(n log n) when few percentiles are needed
 */
export function calculatePercentilesFromNumbers(
  values: number[],
  percentiles: number[] = [50, 90, 95, 99]
): Map<number, number> {
  const result = new Map<number, number>();

  if (values.length === 0) {
    for (const p of percentiles) {
      result.set(p, 0);
    }
    return result;
  }

  // For small arrays or many percentiles, sorting is more efficient
  if (values.length < 100 || percentiles.length > 5) {
    const sorted = [...values].sort((a, b) => a - b);
    for (const p of percentiles) {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      result.set(p, sorted[Math.max(0, index)]);
    }
    return result;
  }

  // Use quickselect for larger arrays with few percentiles
  for (const p of percentiles) {
    const index = Math.max(0, Math.ceil((p / 100) * values.length) - 1);
    // Create a copy for each quickselect since it modifies the array
    result.set(p, quickselect([...values], index));
  }

  return result;
}

/**
 * Binary search to find insertion index in a sorted array
 */
export function binarySearchIndex(
  arr: number[],
  target: number,
  compare: (a: number, b: number) => number = (a, b) => a - b
): number {
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (compare(arr[mid], target) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate mean/average of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
