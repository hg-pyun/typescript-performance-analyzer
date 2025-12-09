import type { TraceEvent, ProcessedEvent, TraceCategory } from './types.js';

interface EventStack {
  event: TraceEvent;
  startTime: number;
}

/**
 * Insert event in sorted order (binary search insertion)
 * More efficient than sorting at the end when most events are already in order
 */
function insertSorted(arr: ProcessedEvent[], event: ProcessedEvent): void {
  // Fast path: if array is empty or event belongs at the end
  if (arr.length === 0 || event.startTime >= arr[arr.length - 1].startTime) {
    arr.push(event);
    return;
  }

  // Binary search for insertion point
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (arr[mid].startTime < event.startTime) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  arr.splice(low, 0, event);
}

/**
 * Process raw trace events:
 * 1. Match B/E (Begin/End) event pairs
 * 2. Convert timestamps to milliseconds
 * 3. Normalize to start from 0
 * 4. Extract file paths
 */
export function processEvents(rawEvents: TraceEvent[]): ProcessedEvent[] {
  // Filter out metadata events
  const events = rawEvents.filter((e) => e.ph !== 'M');

  if (events.length === 0) {
    return [];
  }

  // Sort by timestamp
  events.sort((a, b) => a.ts - b.ts);

  // Find the minimum timestamp for normalization
  const minTimestamp = events[0].ts;

  const processedEvents: ProcessedEvent[] = [];
  const eventStacks = new Map<string, EventStack[]>();
  let idCounter = 0;

  for (const event of events) {
    const stackKey = `${event.pid}-${event.tid}-${event.name}-${event.cat}`;

    if (event.ph === 'X') {
      // Complete event - already has duration, insert in sorted order
      insertSorted(processedEvents, {
        id: `event-${idCounter++}`,
        name: event.name,
        category: event.cat as TraceCategory,
        startTime: (event.ts - minTimestamp) / 1000, // Convert to ms
        duration: (event.dur ?? 0) / 1000,
        filePath: extractFilePath(event),
        args: event.args,
      });
    } else if (event.ph === 'B') {
      // Begin event - push to stack
      if (!eventStacks.has(stackKey)) {
        eventStacks.set(stackKey, []);
      }
      eventStacks.get(stackKey)!.push({
        event,
        startTime: event.ts,
      });
    } else if (event.ph === 'E') {
      // End event - pop from stack and calculate duration
      const stack = eventStacks.get(stackKey);
      if (stack && stack.length > 0) {
        const beginEntry = stack.pop()!;
        const duration = event.ts - beginEntry.startTime;

        // Insert in sorted order - most B/E events maintain order, so this is efficient
        insertSorted(processedEvents, {
          id: `event-${idCounter++}`,
          name: beginEntry.event.name,
          category: beginEntry.event.cat as TraceCategory,
          startTime: (beginEntry.startTime - minTimestamp) / 1000,
          duration: duration / 1000,
          filePath: extractFilePath(beginEntry.event) || extractFilePath(event),
          args: { ...beginEntry.event.args, ...event.args },
        });
      }
    }
  }

  // No final sort needed - events are already in sorted order
  return processedEvents;
}

/**
 * Extract file path from event args
 */
function extractFilePath(event: TraceEvent): string | undefined {
  if (!event.args) return undefined;

  // Try different possible path fields
  return (
    event.args.path ||
    event.args.fileName ||
    event.args.containingFileName ||
    event.args.configFilePath
  );
}

/**
 * Filter events by minimum duration
 */
export function filterByDuration(
  events: ProcessedEvent[],
  minDurationMs: number
): ProcessedEvent[] {
  return events.filter((e) => e.duration >= minDurationMs);
}

/**
 * Filter events by category
 */
export function filterByCategory(
  events: ProcessedEvent[],
  categories: TraceCategory[]
): ProcessedEvent[] {
  return events.filter((e) => categories.includes(e.category));
}

/**
 * Get unique file paths from events as a Set
 * More efficient for membership checks
 */
export function getUniqueFilePathsSet(events: ProcessedEvent[]): Set<string> {
  const paths = new Set<string>();
  for (const event of events) {
    if (event.filePath) {
      paths.add(event.filePath);
    }
  }
  return paths;
}

/**
 * Get unique file paths from events as an array
 * @deprecated Use getUniqueFilePathsSet for better performance when only checking membership
 */
export function getUniqueFilePaths(events: ProcessedEvent[]): string[] {
  return Array.from(getUniqueFilePathsSet(events));
}
