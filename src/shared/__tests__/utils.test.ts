import { describe, it, expect } from 'vitest';
import { getPhase, getTopN } from '../utils';

describe('getPhase', () => {
  it('should return "parse" for parse category', () => {
    expect(getPhase('parse')).toBe('parse');
  });

  it('should return "bind" for bind category', () => {
    expect(getPhase('bind')).toBe('bind');
  });

  it('should return "check" for check category', () => {
    expect(getPhase('check')).toBe('check');
  });

  it('should return "check" for checkTypes category', () => {
    expect(getPhase('checkTypes')).toBe('check');
  });

  it('should return "emit" for emit category', () => {
    expect(getPhase('emit')).toBe('emit');
  });

  it('should return null for program category', () => {
    expect(getPhase('program')).toBeNull();
  });

  it('should return null for __metadata category', () => {
    expect(getPhase('__metadata')).toBeNull();
  });
});

describe('getTopN', () => {
  it('should return top N items sorted by value descending', () => {
    const items = [
      { name: 'a', value: 10 },
      { name: 'b', value: 30 },
      { name: 'c', value: 20 },
      { name: 'd', value: 5 },
    ];

    const result = getTopN(items, 2, (item) => item.value);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(30);
    expect(result[1].value).toBe(20);
  });

  it('should return all items when n >= array length', () => {
    const items = [
      { name: 'a', value: 10 },
      { name: 'b', value: 30 },
    ];

    const result = getTopN(items, 5, (item) => item.value);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(30);
    expect(result[1].value).toBe(10);
  });

  it('should handle empty array', () => {
    const result = getTopN([], 3, (item: { value: number }) => item.value);
    expect(result).toHaveLength(0);
  });

  it('should handle n = 1', () => {
    const items = [
      { name: 'a', value: 10 },
      { name: 'b', value: 30 },
      { name: 'c', value: 20 },
    ];

    const result = getTopN(items, 1, (item) => item.value);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(30);
  });

  it('should handle items with same values', () => {
    const items = [
      { name: 'a', value: 10 },
      { name: 'b', value: 10 },
      { name: 'c', value: 10 },
    ];

    const result = getTopN(items, 2, (item) => item.value);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(10);
    expect(result[1].value).toBe(10);
  });

  it('should work with large arrays', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      name: `item${i}`,
      value: Math.random() * 1000,
    }));

    const result = getTopN(items, 5, (item) => item.value);

    expect(result).toHaveLength(5);
    // Verify descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].value).toBeGreaterThanOrEqual(result[i + 1].value);
    }
  });
});
