import type {
  ProcessedEvent,
  TimelineData,
  CompilationMetrics,
  Hotspots,
  HotspotItem,
} from '../parser/types.js';
import { formatDuration } from '../shared/formatters.js';
import { getTopN } from '../shared/utils.js';
import { calculatePercentilesFromNumbers } from '../shared/algorithms.js';
import { calculateTotalPhaseTime } from '../shared/cli-formatters.js';

/**
 * Calculate comprehensive compilation metrics
 */
export function calculateMetrics(timeline: TimelineData): CompilationMetrics {
  return {
    totalFiles: timeline.files.length,
    totalDuration: timeline.totalDuration,
    totalEvents: timeline.events.length,
    phases: timeline.phases,
    hotspots: calculateHotspots(timeline),
  };
}

/**
 * Identify performance hotspots
 */
function calculateHotspots(timeline: TimelineData): Hotspots {
  const files = timeline.files;

  // Top slowest files overall (files are already sorted by totalTime)
  const slowestFiles: HotspotItem[] = files.slice(0, 20).map((f) => ({
    filePath: f.filePath,
    shortPath: f.shortPath,
    duration: f.totalTime,
  }));

  // Top slowest parse files - use getTopN instead of full sort
  const topParseFiles = getTopN(files, 10, (f) => f.parseTime);
  const slowestParseFiles: HotspotItem[] = topParseFiles
    .filter((f) => f.parseTime > 0)
    .map((f) => ({
      filePath: f.filePath,
      shortPath: f.shortPath,
      duration: f.parseTime,
      category: 'parse' as const,
    }));

  // Top slowest check files - use getTopN instead of full sort
  const topCheckFiles = getTopN(files, 10, (f) => f.checkTime);
  const slowestCheckFiles: HotspotItem[] = topCheckFiles
    .filter((f) => f.checkTime > 0)
    .map((f) => ({
      filePath: f.filePath,
      shortPath: f.shortPath,
      duration: f.checkTime,
      category: 'check' as const,
    }));

  return {
    slowestFiles,
    slowestParseFiles,
    slowestCheckFiles,
  };
}

/**
 * Calculate percentile values for event durations
 * Delegates to the shared algorithms module
 */
export function calculatePercentiles(
  events: ProcessedEvent[],
  percentiles: number[] = [50, 90, 95, 99]
): Map<number, number> {
  const durations = events.map((e) => e.duration);
  return calculatePercentilesFromNumbers(durations, percentiles);
}

/**
 * Generate a text summary of metrics
 */
export function generateMetricsSummary(metrics: CompilationMetrics): string {
  const lines: string[] = [];

  lines.push('=== TypeScript Compilation Summary ===');
  lines.push('');

  // Overall stats
  lines.push(`Total Duration: ${formatDuration(metrics.totalDuration)}`);
  lines.push(`Files Processed: ${metrics.totalFiles.toLocaleString()}`);
  lines.push(`Total Events: ${metrics.totalEvents.toLocaleString()}`);
  lines.push('');

  // Phase breakdown
  lines.push('Phase Breakdown:');
  const phases = metrics.phases;
  const totalPhaseTime = calculateTotalPhaseTime(phases);

  lines.push(formatPhaseRow('Parse', phases.parse, totalPhaseTime));
  lines.push(formatPhaseRow('Bind', phases.bind, totalPhaseTime));
  lines.push(formatPhaseRow('Check', phases.check, totalPhaseTime));
  lines.push(formatPhaseRow('Emit', phases.emit, totalPhaseTime));
  lines.push('');

  // Hotspots
  lines.push('Top 10 Slowest Files:');
  for (let i = 0; i < Math.min(10, metrics.hotspots.slowestFiles.length); i++) {
    const file = metrics.hotspots.slowestFiles[i];
    lines.push(
      `  ${i + 1}. ${file.shortPath} - ${formatDuration(file.duration)}`
    );
  }

  return lines.join('\n');
}

/**
 * Format phase row for summary
 */
function formatPhaseRow(
  name: string,
  phase: { totalTime: number; count: number },
  total: number
): string {
  const percentage =
    total > 0 ? ((phase.totalTime / total) * 100).toFixed(1) : '0.0';
  return `  ${name.padEnd(8)}: ${formatDuration(phase.totalTime).padStart(10)} (${percentage}%) - ${phase.count.toLocaleString()} events`;
}

/**
 * Compare two compilation metrics
 */
export function compareMetrics(
  baseline: CompilationMetrics,
  current: CompilationMetrics
): {
  durationDiff: number;
  durationDiffPercentage: number;
  fileCountDiff: number;
  phaseDiffs: Record<string, { diff: number; percentage: number }>;
} {
  const durationDiff = current.totalDuration - baseline.totalDuration;
  const durationDiffPercentage =
    baseline.totalDuration > 0
      ? (durationDiff / baseline.totalDuration) * 100
      : 0;

  const calcPhaseDiff = (
    basePhase: { totalTime: number },
    currPhase: { totalTime: number }
  ) => {
    const diff = currPhase.totalTime - basePhase.totalTime;
    const percentage =
      basePhase.totalTime > 0 ? (diff / basePhase.totalTime) * 100 : 0;
    return { diff, percentage };
  };

  return {
    durationDiff,
    durationDiffPercentage,
    fileCountDiff: current.totalFiles - baseline.totalFiles,
    phaseDiffs: {
      parse: calcPhaseDiff(baseline.phases.parse, current.phases.parse),
      bind: calcPhaseDiff(baseline.phases.bind, current.phases.bind),
      check: calcPhaseDiff(baseline.phases.check, current.phases.check),
      emit: calcPhaseDiff(baseline.phases.emit, current.phases.emit),
    },
  };
}
