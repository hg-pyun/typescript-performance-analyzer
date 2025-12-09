/**
 * TypeScript --generateTrace output type definitions
 */

// Chrome Trace Event format types
export type TracePhase = 'B' | 'E' | 'X' | 'M' | 'I';

export type TraceCategory =
  | 'parse'
  | 'bind'
  | 'check'
  | 'checkTypes'
  | 'program'
  | 'emit'
  | '__metadata';

export interface TraceEvent {
  pid: number;
  tid: number;
  ph: TracePhase;
  cat: TraceCategory;
  ts: number; // Microseconds
  name: string;
  dur?: number; // Duration for 'X' (complete) events
  args?: TraceEventArgs;
}

export interface TraceEventArgs {
  path?: string;
  fileName?: string;
  configFilePath?: string;
  containingFileName?: string;
  [key: string]: unknown;
}

// Processed event types
export interface ProcessedEvent {
  id: string;
  name: string;
  category: TraceCategory;
  startTime: number; // Milliseconds, normalized to 0
  duration: number; // Milliseconds
  filePath?: string;
  args?: TraceEventArgs;
}

// File-aggregated data
export interface FileEvents {
  filePath: string;
  shortPath: string;
  events: ProcessedEvent[];
  totalTime: number;
  parseTime: number;
  bindTime: number;
  checkTime: number;
  emitTime: number;
}

// Timeline visualization data
export interface TimelineData {
  totalDuration: number;
  startTime: number;
  endTime: number;
  phases: PhaseInfo;
  files: FileEvents[];
  events: ProcessedEvent[]; // All events for timeline
}

export interface PhaseInfo {
  parse: PhaseTiming;
  bind: PhaseTiming;
  check: PhaseTiming;
  emit: PhaseTiming;
}

export interface PhaseTiming {
  totalTime: number;
  count: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
}

// Metrics and statistics
export interface CompilationMetrics {
  totalFiles: number;
  totalDuration: number;
  totalEvents: number;
  phases: PhaseInfo;
  hotspots: Hotspots;
}

export interface Hotspots {
  slowestFiles: HotspotItem[];
  slowestParseFiles: HotspotItem[];
  slowestCheckFiles: HotspotItem[];
}

export interface HotspotItem {
  filePath: string;
  shortPath: string;
  duration: number;
  category?: TraceCategory;
}

// Report data (sent to visualization)
export interface ReportData {
  metadata: ReportMetadata;
  timeline: TimelineData;
  metrics: CompilationMetrics;
}

export interface ReportMetadata {
  generatedAt: string;
  traceFile: string;
  version: string;
}

// Types.json structure (optional analysis)
export interface TypeInfo {
  id: number;
  intrinsicName?: string;
  recursionId?: number;
  flags?: string;
  display?: string;
  unionTypes?: number[];
  intersectionTypes?: number[];
}

// Code location for slow spots within a file
export interface CodeLocation {
  pos: number;
  end: number;
  kind: number;
  kindName: string;
  duration: number;
  eventName: string;
  typeIds?: number[];
  // Code snippet fields (populated when --project option is used)
  codeSnippet?: string;
  lineNumber?: number;
  columnNumber?: number;
}

// Detailed file information with slow code locations
export interface FileLocationDetails {
  filePath: string;
  shortPath: string;
  totalTime: number;
  locations: CodeLocation[];
}

// Re-export constants from shared module for backward compatibility
export { PHASE_COLORS, PHASE_NAMES } from '../shared/constants.js';
