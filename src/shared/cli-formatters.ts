/**
 * CLI-specific formatting utilities
 * Used for terminal output formatting with colors and progress bars
 */

import chalk from 'chalk';
import { formatDuration } from './formatters.js';

/**
 * Create a progress bar with filled and empty characters
 */
export function createBar(ratio: number, width: number): string {
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Create a colored progress bar
 */
export function createColoredBar(
  ratio: number,
  width: number,
  colorFn: (s: string) => string
): string {
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return colorFn('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Format a phase row for CLI output
 */
export function formatPhase(name: string, time: number, total: number): string {
  const percentage = total > 0 ? ((time / total) * 100).toFixed(1) : '0.0';
  const bar = createBar(total > 0 ? time / total : 0, 20);
  return `  ${name.padEnd(8)} ${bar} ${formatDuration(time).padStart(10)} (${percentage}%)`;
}

/**
 * Print a phase bar with custom color
 */
export function printPhaseBar(
  name: string,
  time: number,
  total: number,
  colorFn: (s: string) => string
): void {
  const percentage = total > 0 ? (time / total) * 100 : 0;
  const barWidth = 25;
  const bar = createColoredBar(percentage / 100, barWidth, colorFn);
  console.log(
    `   ${name.padEnd(8)} ${bar} ${formatDuration(time).padStart(10)} (${percentage.toFixed(1)}%)`
  );
}

/**
 * Calculate total phase time from phase metrics
 */
export function calculateTotalPhaseTime(phases: {
  parse: { totalTime: number };
  bind: { totalTime: number };
  check: { totalTime: number };
  emit: { totalTime: number };
}): number {
  return (
    phases.parse.totalTime +
    phases.bind.totalTime +
    phases.check.totalTime +
    phases.emit.totalTime
  );
}
