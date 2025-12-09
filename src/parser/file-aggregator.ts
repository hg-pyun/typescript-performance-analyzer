import type { ProcessedEvent, FileEvents, TraceCategory } from './types.js';

/**
 * Aggregate events by file path
 */
export function aggregateByFile(events: ProcessedEvent[]): FileEvents[] {
  const fileMap = new Map<string, ProcessedEvent[]>();

  // Group events by file path
  for (const event of events) {
    const filePath = event.filePath || '__no_file__';
    if (!fileMap.has(filePath)) {
      fileMap.set(filePath, []);
    }
    fileMap.get(filePath)!.push(event);
  }

  // Convert to FileEvents array
  const fileEvents: FileEvents[] = [];

  for (const [filePath, fileEventList] of fileMap) {
    if (filePath === '__no_file__') continue;

    const timings = calculateFileTiming(fileEventList);

    fileEvents.push({
      filePath,
      shortPath: shortenPath(filePath),
      events: fileEventList,
      totalTime: timings.total,
      parseTime: timings.parse,
      bindTime: timings.bind,
      checkTime: timings.check,
      emitTime: timings.emit,
    });
  }

  // Sort by total time (descending)
  fileEvents.sort((a, b) => b.totalTime - a.totalTime);

  return fileEvents;
}

/**
 * Calculate timing breakdown for a file's events
 */
function calculateFileTiming(events: ProcessedEvent[]): {
  total: number;
  parse: number;
  bind: number;
  check: number;
  emit: number;
} {
  let parse = 0;
  let bind = 0;
  let check = 0;
  let emit = 0;

  for (const event of events) {
    switch (event.category) {
      case 'parse':
        parse += event.duration;
        break;
      case 'bind':
        bind += event.duration;
        break;
      case 'check':
      case 'checkTypes':
        check += event.duration;
        break;
      case 'emit':
        emit += event.duration;
        break;
    }
  }

  return {
    total: parse + bind + check + emit,
    parse,
    bind,
    check,
    emit,
  };
}

/**
 * Shorten file path for display
 */
export function shortenPath(filePath: string): string {
  // Handle node_modules paths
  const nodeModulesIndex = filePath.lastIndexOf('node_modules');
  if (nodeModulesIndex !== -1) {
    return filePath.slice(nodeModulesIndex);
  }

  // Handle relative-like paths
  const parts = filePath.split('/');
  if (parts.length > 4) {
    return '.../' + parts.slice(-3).join('/');
  }

  return filePath;
}

/**
 * Get top N files by total time
 */
export function getTopFiles(files: FileEvents[], n: number): FileEvents[] {
  return files.slice(0, n);
}

/**
 * Get top N files by specific phase
 */
export function getTopFilesByPhase(
  files: FileEvents[],
  phase: 'parse' | 'bind' | 'check' | 'emit',
  n: number
): FileEvents[] {
  const sorted = [...files].sort((a, b) => {
    switch (phase) {
      case 'parse':
        return b.parseTime - a.parseTime;
      case 'bind':
        return b.bindTime - a.bindTime;
      case 'check':
        return b.checkTime - a.checkTime;
      case 'emit':
        return b.emitTime - a.emitTime;
    }
  });
  return sorted.slice(0, n);
}

/**
 * Calculate category statistics
 */
export function calculateCategoryStats(
  events: ProcessedEvent[]
): Map<TraceCategory, { count: number; totalTime: number }> {
  const stats = new Map<TraceCategory, { count: number; totalTime: number }>();

  for (const event of events) {
    if (!stats.has(event.category)) {
      stats.set(event.category, { count: 0, totalTime: 0 });
    }
    const stat = stats.get(event.category)!;
    stat.count++;
    stat.totalTime += event.duration;
  }

  return stats;
}
