import type {
  ProcessedEvent,
  FileEvents,
  TimelineData,
  PhaseInfo,
  PhaseTiming,
} from '../parser/types.js';
import { aggregateByFile } from '../parser/file-aggregator.js';
import { formatDuration } from '../shared/formatters.js';

/**
 * Build timeline data structure for visualization
 */
export function buildTimeline(events: ProcessedEvent[]): TimelineData {
  if (events.length === 0) {
    return createEmptyTimeline();
  }

  // Calculate overall timing - single pass for min/max
  let startTime = Infinity;
  let endTime = -Infinity;
  for (const e of events) {
    if (e.startTime < startTime) startTime = e.startTime;
    const end = e.startTime + e.duration;
    if (end > endTime) endTime = end;
  }
  const totalDuration = endTime - startTime;

  // Calculate phase timings
  const phases = calculatePhaseInfo(events);

  // Aggregate by file
  const files = aggregateByFile(events);

  return {
    totalDuration,
    startTime,
    endTime,
    phases,
    files,
    events,
  };
}

/**
 * Calculate phase timing information
 */
function calculatePhaseInfo(events: ProcessedEvent[]): PhaseInfo {
  const phaseEvents: Record<string, ProcessedEvent[]> = {
    parse: [],
    bind: [],
    check: [],
    emit: [],
  };

  // Group events by phase
  for (const event of events) {
    switch (event.category) {
      case 'parse':
        phaseEvents.parse.push(event);
        break;
      case 'bind':
        phaseEvents.bind.push(event);
        break;
      case 'check':
      case 'checkTypes':
        phaseEvents.check.push(event);
        break;
      case 'emit':
        phaseEvents.emit.push(event);
        break;
    }
  }

  return {
    parse: calculatePhaseTiming(phaseEvents.parse),
    bind: calculatePhaseTiming(phaseEvents.bind),
    check: calculatePhaseTiming(phaseEvents.check),
    emit: calculatePhaseTiming(phaseEvents.emit),
  };
}

/**
 * Calculate timing statistics for a phase - single pass optimization
 */
function calculatePhaseTiming(events: ProcessedEvent[]): PhaseTiming {
  if (events.length === 0) {
    return {
      totalTime: 0,
      count: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: 0,
    };
  }

  let totalTime = 0;
  let maxTime = -Infinity;
  let minTime = Infinity;

  for (const e of events) {
    totalTime += e.duration;
    if (e.duration > maxTime) maxTime = e.duration;
    if (e.duration < minTime) minTime = e.duration;
  }

  return {
    totalTime,
    count: events.length,
    avgTime: totalTime / events.length,
    maxTime,
    minTime,
  };
}

/**
 * Create empty timeline data
 */
function createEmptyTimeline(): TimelineData {
  const emptyPhase: PhaseTiming = {
    totalTime: 0,
    count: 0,
    avgTime: 0,
    maxTime: 0,
    minTime: 0,
  };

  return {
    totalDuration: 0,
    startTime: 0,
    endTime: 0,
    phases: {
      parse: emptyPhase,
      bind: emptyPhase,
      check: emptyPhase,
      emit: emptyPhase,
    },
    files: [],
    events: [],
  };
}

// Cache for filterTimelineByRange to avoid redundant calculations
const rangeFilterCache = new WeakMap<TimelineData, Map<string, TimelineData>>();

/**
 * Filter timeline data by time range with caching
 */
export function filterTimelineByRange(
  timeline: TimelineData,
  startMs: number,
  endMs: number
): TimelineData {
  // Check cache first
  const cacheKey = `${startMs}-${endMs}`;
  let timelineCache = rangeFilterCache.get(timeline);

  if (timelineCache?.has(cacheKey)) {
    return timelineCache.get(cacheKey)!;
  }

  // Filter events
  const filteredEvents = timeline.events.filter(
    (e) => e.startTime >= startMs && e.startTime + e.duration <= endMs
  );

  const result = buildTimeline(filteredEvents);

  // Store in cache
  if (!timelineCache) {
    timelineCache = new Map();
    rangeFilterCache.set(timeline, timelineCache);
  }
  timelineCache.set(cacheKey, result);

  return result;
}

/**
 * Clear the range filter cache for a specific timeline or all timelines
 */
export function clearRangeFilterCache(timeline?: TimelineData): void {
  if (timeline) {
    rangeFilterCache.delete(timeline);
  }
}

/**
 * Get events for a specific file
 */
export function getFileTimeline(
  timeline: TimelineData,
  filePath: string
): FileEvents | undefined {
  return timeline.files.find((f) => f.filePath === filePath);
}

/**
 * Search files by path pattern
 */
export function searchFiles(
  timeline: TimelineData,
  pattern: string
): FileEvents[] {
  const lowerPattern = pattern.toLowerCase();
  return timeline.files.filter(
    (f) =>
      f.filePath.toLowerCase().includes(lowerPattern) ||
      f.shortPath.toLowerCase().includes(lowerPattern)
  );
}

/**
 * Get timeline statistics summary
 */
export function getTimelineSummary(timeline: TimelineData): {
  totalDurationFormatted: string;
  fileCount: number;
  eventCount: number;
  phaseBreakdown: { name: string; time: number; percentage: number }[];
} {
  const phases = timeline.phases;
  const totalPhaseTime =
    phases.parse.totalTime +
    phases.bind.totalTime +
    phases.check.totalTime +
    phases.emit.totalTime;

  const phaseBreakdown = [
    {
      name: 'Parse',
      time: phases.parse.totalTime,
      percentage:
        totalPhaseTime > 0
          ? (phases.parse.totalTime / totalPhaseTime) * 100
          : 0,
    },
    {
      name: 'Bind',
      time: phases.bind.totalTime,
      percentage:
        totalPhaseTime > 0 ? (phases.bind.totalTime / totalPhaseTime) * 100 : 0,
    },
    {
      name: 'Check',
      time: phases.check.totalTime,
      percentage:
        totalPhaseTime > 0
          ? (phases.check.totalTime / totalPhaseTime) * 100
          : 0,
    },
    {
      name: 'Emit',
      time: phases.emit.totalTime,
      percentage:
        totalPhaseTime > 0 ? (phases.emit.totalTime / totalPhaseTime) * 100 : 0,
    },
  ];

  return {
    totalDurationFormatted: formatDuration(timeline.totalDuration),
    fileCount: timeline.files.length,
    eventCount: timeline.events.length,
    phaseBreakdown,
  };
}

// Re-export formatDuration for backward compatibility
export { formatDuration } from '../shared/formatters.js';
