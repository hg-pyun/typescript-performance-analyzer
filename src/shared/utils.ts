/**
 * Common utility functions for performance optimization
 */

import type { TraceCategory } from '../parser/types.js';

/**
 * Phase categories mapping for consistent classification
 */
const PHASE_MAP: Record<string, 'parse' | 'bind' | 'check' | 'emit' | null> = {
  parse: 'parse',
  bind: 'bind',
  check: 'check',
  checkTypes: 'check',
  emit: 'emit',
};

/**
 * Get the phase for a given category
 */
export function getPhase(
  category: TraceCategory
): 'parse' | 'bind' | 'check' | 'emit' | null {
  return PHASE_MAP[category] ?? null;
}

/**
 * Get top N items from array by a numeric property
 * More efficient than full sort when N << array.length
 */
export function getTopN<T>(
  items: T[],
  n: number,
  getValue: (item: T) => number
): T[] {
  if (items.length <= n) {
    return [...items].sort((a, b) => getValue(b) - getValue(a));
  }

  const result: T[] = [];

  for (const item of items) {
    const value = getValue(item);

    if (result.length < n) {
      result.push(item);
      result.sort((a, b) => getValue(a) - getValue(b));
    } else if (value > getValue(result[0])) {
      result[0] = item;
      result.sort((a, b) => getValue(a) - getValue(b));
    }
  }

  return result.reverse();
}
