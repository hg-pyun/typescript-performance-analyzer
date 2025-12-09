import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createBar,
  createColoredBar,
  formatPhase,
  printPhaseBar,
  calculateTotalPhaseTime,
} from '../cli-formatters';

describe('createBar', () => {
  it('should create empty bar for ratio 0', () => {
    const bar = createBar(0, 10);
    // Bar should contain only empty characters (gray ░)
    expect(bar).toContain('░');
    // eslint-disable-next-line no-control-regex
    expect(bar.replace(/\x1b\[[0-9;]*m/g, '')).toBe('░░░░░░░░░░');
  });

  it('should create full bar for ratio 1', () => {
    const bar = createBar(1, 10);
    // Bar should contain only filled characters (cyan █)
    expect(bar).toContain('█');
    // eslint-disable-next-line no-control-regex
    expect(bar.replace(/\x1b\[[0-9;]*m/g, '')).toBe('██████████');
  });

  it('should create partial bar for ratio 0.5', () => {
    const bar = createBar(0.5, 10);
    // eslint-disable-next-line no-control-regex
    const cleanBar = bar.replace(/\x1b\[[0-9;]*m/g, '');
    expect(cleanBar).toBe('█████░░░░░');
  });

  it('should handle different widths', () => {
    const bar = createBar(0.5, 20);
    // eslint-disable-next-line no-control-regex
    const cleanBar = bar.replace(/\x1b\[[0-9;]*m/g, '');
    expect(cleanBar.length).toBe(20);
    expect(cleanBar).toBe('██████████░░░░░░░░░░');
  });
});

describe('createColoredBar', () => {
  it('should apply custom color function to filled portion', () => {
    const colorFn = (s: string) => `[COLORED]${s}[/COLORED]`;
    const bar = createColoredBar(0.5, 10, colorFn);

    expect(bar).toContain('[COLORED]');
    expect(bar).toContain('█████');
  });

  it('should handle ratio 0', () => {
    const colorFn = (s: string) => `[COLORED]${s}[/COLORED]`;
    const bar = createColoredBar(0, 10, colorFn);

    expect(bar).toContain('[COLORED][/COLORED]');
  });
});

describe('formatPhase', () => {
  it('should format phase with name, bar, duration and percentage', () => {
    const result = formatPhase('parse', 500, 1000);

    expect(result).toContain('parse');
    expect(result).toContain('500.00ms');
    expect(result).toContain('50.0%');
  });

  it('should handle 0 total', () => {
    const result = formatPhase('parse', 500, 0);

    expect(result).toContain('parse');
    expect(result).toContain('0.0%');
  });

  it('should pad name correctly', () => {
    const result = formatPhase('a', 100, 1000);
    // Name should be padded to 8 characters
    expect(result).toContain('a       ');
  });
});

describe('printPhaseBar', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should print phase bar to console', () => {
    const colorFn = (s: string) => s;
    printPhaseBar('parse', 500, 1000, colorFn);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('parse');
    expect(output).toContain('500.00ms');
    expect(output).toContain('50.0%');
  });

  it('should handle 0 total', () => {
    const colorFn = (s: string) => s;
    printPhaseBar('parse', 500, 0, colorFn);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('0.0%');
  });
});

describe('calculateTotalPhaseTime', () => {
  it('should sum all phase times', () => {
    const phases = {
      parse: { totalTime: 100 },
      bind: { totalTime: 200 },
      check: { totalTime: 300 },
      emit: { totalTime: 400 },
    };

    const total = calculateTotalPhaseTime(phases);
    expect(total).toBe(1000);
  });

  it('should handle all zeros', () => {
    const phases = {
      parse: { totalTime: 0 },
      bind: { totalTime: 0 },
      check: { totalTime: 0 },
      emit: { totalTime: 0 },
    };

    const total = calculateTotalPhaseTime(phases);
    expect(total).toBe(0);
  });

  it('should handle single non-zero phase', () => {
    const phases = {
      parse: { totalTime: 0 },
      bind: { totalTime: 0 },
      check: { totalTime: 500 },
      emit: { totalTime: 0 },
    };

    const total = calculateTotalPhaseTime(phases);
    expect(total).toBe(500);
  });

  it('should handle floating point times', () => {
    const phases = {
      parse: { totalTime: 100.5 },
      bind: { totalTime: 200.25 },
      check: { totalTime: 300.125 },
      emit: { totalTime: 400.125 },
    };

    const total = calculateTotalPhaseTime(phases);
    expect(total).toBe(1001);
  });
});
