import { describe, it, expect } from 'vitest';
import {
  quickselect,
  calculatePercentilesFromNumbers,
  binarySearchIndex,
  standardDeviation,
  mean,
} from '../algorithms';

describe('quickselect', () => {
  it('should find the k-th smallest element', () => {
    const arr = [5, 2, 8, 1, 9, 3, 7];
    // Sorted: [1, 2, 3, 5, 7, 8, 9]
    expect(quickselect([...arr], 0)).toBe(1); // smallest
    expect(quickselect([...arr], 3)).toBe(5); // median
    expect(quickselect([...arr], 6)).toBe(9); // largest
  });

  it('should handle single element array', () => {
    expect(quickselect([42], 0)).toBe(42);
  });

  it('should handle two element array', () => {
    expect(quickselect([5, 3], 0)).toBe(3);
    expect(quickselect([5, 3], 1)).toBe(5);
  });

  it('should handle array with duplicate values', () => {
    const arr = [3, 1, 3, 3, 2];
    // Sorted: [1, 2, 3, 3, 3]
    expect(quickselect([...arr], 0)).toBe(1);
    expect(quickselect([...arr], 2)).toBe(3);
    expect(quickselect([...arr], 4)).toBe(3);
  });

  it('should handle array with all same values', () => {
    const arr = [5, 5, 5, 5];
    expect(quickselect([...arr], 0)).toBe(5);
    expect(quickselect([...arr], 2)).toBe(5);
  });
});

describe('calculatePercentilesFromNumbers', () => {
  it('should calculate default percentiles', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = calculatePercentilesFromNumbers(values);

    expect(result.get(50)).toBe(50);
    expect(result.get(90)).toBe(90);
    expect(result.get(95)).toBe(95);
    expect(result.get(99)).toBe(99);
  });

  it('should calculate custom percentiles', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = calculatePercentilesFromNumbers(values, [25, 75]);

    expect(result.get(25)).toBe(25);
    expect(result.get(75)).toBe(75);
  });

  it('should handle empty array', () => {
    const result = calculatePercentilesFromNumbers([]);

    expect(result.get(50)).toBe(0);
    expect(result.get(90)).toBe(0);
    expect(result.get(95)).toBe(0);
    expect(result.get(99)).toBe(0);
  });

  it('should handle small arrays (uses sort)', () => {
    const values = [1, 2, 3, 4, 5];
    const result = calculatePercentilesFromNumbers(values, [50]);

    expect(result.get(50)).toBe(3);
  });

  it('should handle large arrays (uses quickselect)', () => {
    const values = Array.from({ length: 200 }, (_, i) => i + 1);
    const result = calculatePercentilesFromNumbers(values, [50]);

    expect(result.get(50)).toBe(100);
  });

  it('should handle unsorted input', () => {
    const values = [100, 1, 50, 25, 75, 10, 90];
    const sorted = [...values].sort((a, b) => a - b);
    // Sorted: [1, 10, 25, 50, 75, 90, 100]
    const result = calculatePercentilesFromNumbers(values, [50]);

    // p50 index = ceil(0.5 * 7) - 1 = 3
    expect(result.get(50)).toBe(sorted[3]); // 50
  });
});

describe('binarySearchIndex', () => {
  it('should find insertion index in sorted array', () => {
    const arr = [1, 3, 5, 7, 9];

    expect(binarySearchIndex(arr, 0)).toBe(0); // before first
    expect(binarySearchIndex(arr, 1)).toBe(0); // equal to first
    expect(binarySearchIndex(arr, 2)).toBe(1); // between 1 and 3
    expect(binarySearchIndex(arr, 5)).toBe(2); // equal to middle
    expect(binarySearchIndex(arr, 6)).toBe(3); // between 5 and 7
    expect(binarySearchIndex(arr, 10)).toBe(5); // after last
  });

  it('should handle empty array', () => {
    expect(binarySearchIndex([], 5)).toBe(0);
  });

  it('should handle single element array', () => {
    expect(binarySearchIndex([5], 3)).toBe(0);
    expect(binarySearchIndex([5], 5)).toBe(0);
    expect(binarySearchIndex([5], 7)).toBe(1);
  });

  it('should handle custom compare function', () => {
    const arr = [9, 7, 5, 3, 1]; // descending order
    const compare = (a: number, b: number) => b - a; // reverse compare

    expect(binarySearchIndex(arr, 6, compare)).toBe(2);
    expect(binarySearchIndex(arr, 10, compare)).toBe(0);
    expect(binarySearchIndex(arr, 0, compare)).toBe(5);
  });

  it('should handle array with duplicates', () => {
    const arr = [1, 3, 3, 3, 5];

    // Should return the first position where target can be inserted
    expect(binarySearchIndex(arr, 3)).toBe(1);
    expect(binarySearchIndex(arr, 4)).toBe(4);
  });
});

describe('standardDeviation', () => {
  it('should calculate standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    // Mean = 5, Variance = 4, StdDev = 2
    expect(standardDeviation(values)).toBe(2);
  });

  it('should handle empty array', () => {
    expect(standardDeviation([])).toBe(0);
  });

  it('should handle single element', () => {
    expect(standardDeviation([5])).toBe(0);
  });

  it('should handle array with same values', () => {
    expect(standardDeviation([5, 5, 5, 5])).toBe(0);
  });

  it('should handle two element array', () => {
    const values = [0, 10];
    // Mean = 5, Variance = 25, StdDev = 5
    expect(standardDeviation(values)).toBe(5);
  });
});

describe('mean', () => {
  it('should calculate mean of array', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20, 30])).toBe(20);
  });

  it('should handle empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('should handle single element', () => {
    expect(mean([42])).toBe(42);
  });

  it('should handle array with same values', () => {
    expect(mean([5, 5, 5, 5])).toBe(5);
  });

  it('should handle floating point numbers', () => {
    expect(mean([1.5, 2.5, 3.0])).toBeCloseTo(2.333, 2);
  });

  it('should handle negative numbers', () => {
    expect(mean([-5, 0, 5])).toBe(0);
    expect(mean([-10, -20, -30])).toBe(-20);
  });
});
